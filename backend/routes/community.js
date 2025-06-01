import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

if (!process.env.SUPABASE_URL) {
  throw new Error('SUPABASE_URL environment variable is required');
}

if (!process.env.SUPABASE_ANON_KEY) {
  throw new Error('SUPABASE_ANON_KEY environment variable is required');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

router.post('/publish-sample', async (req, res) => {
  try {
    const { 
      user_id, 
      title, 
      prompt, 
      audio_url, 
      audio_data 
    } = req.body;

    if (!user_id || !title || !prompt || (!audio_url && !audio_data)) {
      return res.status(400).json({ 
        error: 'Missing required fields: user_id, title, prompt, and audio data' 
      });
    }

    let sample_url = audio_url;

    if (audio_data && !audio_url) {
      try {
        const timestamp = Date.now();
        const filename = `${user_id}_${timestamp}_${title.replace(/[^a-zA-Z0-9]/g, '_')}.mp3`;
        
        let audioBuffer;
        if (typeof audio_data === 'string' && audio_data.startsWith('data:')) {
          const base64Data = audio_data.split(',')[1];
          audioBuffer = Buffer.from(base64Data, 'base64');
        } else if (typeof audio_data === 'string') {
          audioBuffer = Buffer.from(audio_data, 'base64');
        } else {
          audioBuffer = audio_data;
        }

        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from('samples')
          .upload(`Samples/${filename}`, audioBuffer, {
            contentType: 'audio/mpeg',
            upsert: false
          });

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          return res.status(500).json({ 
            error: 'Failed to upload audio file',
            details: uploadError.message 
          });
        }

        const { data: urlData } = supabaseAdmin.storage
          .from('samples')
          .getPublicUrl(`Samples/${filename}`);

        sample_url = urlData.publicUrl;
      } catch (uploadError) {
        console.error('Audio upload process error:', uploadError);
        return res.status(500).json({ 
          error: 'Failed to process audio upload',
          details: uploadError.message 
        });
      }
    }

    const expires_at = new Date();
    expires_at.setDate(expires_at.getDate() + 7);

    const { data: sampleData, error: insertError } = await supabaseAdmin
      .from('samples')
      .insert([
        {
          user_id,
          title,
          prompt,
          sample_url,
          likes_count: 0,
          saved: false,
          expires_at: expires_at.toISOString()
        }
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      return res.status(500).json({ 
        error: 'Failed to save sample to database',
        details: insertError.message 
      });
    }

    res.status(201).json({
      success: true,
      message: `Sample "${title}" published successfully!`,
      sample: sampleData
    });

  } catch (error) {
    console.error('Publish sample error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

router.get('/samples', async (req, res) => {
  try {
    const { data: samples, error } = await supabase
      .from('samples')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ 
        error: 'Failed to fetch samples',
        details: error.message 
      });
    }

    res.json({ samples });
  } catch (error) {
    console.error('Fetch samples error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

router.get('/samples/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: sample, error } = await supabase
      .from('samples')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({ 
        error: 'Sample not found',
        details: error.message 
      });
    }

    res.json({ sample });
  } catch (error) {
    console.error('Fetch sample error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

router.get('/user-samples/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;

    const { data: samples, error } = await supabase
      .from('samples')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ 
        error: 'Failed to fetch user samples',
        details: error.message 
      });
    }

    res.json({ samples });
  } catch (error) {
    console.error('Fetch user samples error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

router.delete('/samples/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ 
        error: 'User ID is required for deletion' 
      });
    }

    const { data: sample, error: fetchError } = await supabase
      .from('samples')
      .select('*')
      .eq('id', id)
      .eq('user_id', user_id) 
      .single();

    if (fetchError || !sample) {
      return res.status(404).json({ 
        error: 'Sample not found or you do not have permission to delete it' 
      });
    }

    const { error: deleteError } = await supabaseAdmin
      .from('samples')
      .delete()
      .eq('id', id)
      .eq('user_id', user_id);

    if (deleteError) {
      console.error('Database delete error:', deleteError);
      return res.status(500).json({ 
        error: 'Failed to delete sample from database',
        details: deleteError.message 
      });
    }

    if (sample.sample_url) {
      try {
        const urlParts = sample.sample_url.split('/');
        const filename = urlParts[urlParts.length - 1];
        
        if (filename && filename !== 'undefined') {
          const { error: storageError } = await supabaseAdmin.storage
            .from('samples')
            .remove([`Samples/${filename}`]);

          if (storageError) {
            console.warn('Storage delete warning:', storageError);
          }
        }
      } catch (storageError) {
        console.warn('Error deleting from storage:', storageError);
      }
    }

    res.json({
      success: true,
      message: `Sample "${sample.title}" deleted successfully!`
    });

  } catch (error) {
    console.error('Delete sample error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

router.get('/user-saved-samples/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;

    const { data: samples, error } = await supabase
      .from('samples')
      .select('*')
      .eq('user_id', user_id)
      .eq('saved', true)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ 
        error: 'Failed to fetch saved samples',
        details: error.message 
      });
    }

    res.json({ samples });
  } catch (error) {
    console.error('Fetch saved samples error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

router.put('/samples/:id/save', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ 
        error: 'User ID is required' 
      });
    }

    const { data: sample, error: fetchError } = await supabase
      .from('samples')
      .select('*')
      .eq('id', id)
      .eq('user_id', user_id) 
      .single();

    if (fetchError || !sample) {
      return res.status(404).json({ 
        error: 'Sample not found or you do not have permission to save it' 
      });
    }

    const newSavedStatus = !sample.saved;

    const { data: updatedSample, error: updateError } = await supabaseAdmin
      .from('samples')
      .update({ saved: newSavedStatus })
      .eq('id', id)
      .eq('user_id', user_id)
      .select()
      .single();

    if (updateError) {
      console.error('Database update error:', updateError);
      return res.status(500).json({ 
        error: 'Failed to update sample save status',
        details: updateError.message 
      });
    }

    res.json({
      success: true,
      message: `Sample "${sample.title}" ${newSavedStatus ? 'saved' : 'unsaved'} successfully!`,
      sample: updatedSample,
      saved: newSavedStatus
    });

  } catch (error) {
    console.error('Save sample error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

export default router;