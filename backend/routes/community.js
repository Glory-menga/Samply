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

router.post('/samples/:id/like', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ 
        error: 'User ID is required' 
      });
    }

    const { data: existingLike, error: likeCheckError } = await supabase
      .from('likes')
      .select('*')
      .eq('user_id', user_id)
      .eq('sample_id', id)
      .single();

    let isLiking = true;

    if (existingLike && !likeCheckError) {
      const { error: deleteError } = await supabaseAdmin
        .from('likes')
        .delete()
        .eq('user_id', user_id)
        .eq('sample_id', id);

      if (deleteError) {
        console.error('Delete like error:', deleteError);
        return res.status(500).json({ 
          error: 'Failed to unlike sample',
          details: deleteError.message 
        });
      }
      isLiking = false;
    } else {
      const { error: insertError } = await supabaseAdmin
        .from('likes')
        .insert([
          {
            user_id,
            sample_id: id,
            liked_at: new Date().toISOString()
          }
        ]);

      if (insertError) {
        console.error('Insert like error:', insertError);
        return res.status(500).json({ 
          error: 'Failed to like sample',
          details: insertError.message 
        });
      }
    }

    const { data: likesCount, error: countError } = await supabase
      .from('likes')
      .select('id', { count: 'exact' })
      .eq('sample_id', id);

    if (countError) {
      console.error('Count likes error:', countError);
      return res.status(500).json({ 
        error: 'Failed to count likes',
        details: countError.message 
      });
    }

    const newLikesCount = likesCount.length;

    const { error: updateError } = await supabaseAdmin
      .from('samples')
      .update({ likes_count: newLikesCount })
      .eq('id', id);

    if (updateError) {
      console.error('Update likes count error:', updateError);
      return res.status(500).json({ 
        error: 'Failed to update likes count',
        details: updateError.message 
      });
    }

    res.json({
      success: true,
      message: isLiking ? 'Sample liked successfully!' : 'Sample unliked successfully!',
      liked: isLiking,
      likes_count: newLikesCount
    });

  } catch (error) {
    console.error('Like sample error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

router.get('/user-likes/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;

    const { data: likes, error } = await supabase
      .from('likes')
      .select('*')
      .eq('user_id', user_id)
      .order('liked_at', { ascending: false });

    if (error) {
      console.error('Fetch user likes error:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch user likes',
        details: error.message 
      });
    }

    res.json({ likes: likes || [] });
  } catch (error) {
    console.error('Fetch user likes error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

router.get('/user-liked-samples/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;

    const { data: likes, error: likesError } = await supabase
      .from('likes')
      .select('sample_id')
      .eq('user_id', user_id)
      .order('liked_at', { ascending: false });

    if (likesError) {
      console.error('Fetch likes error:', likesError);
      return res.status(500).json({ 
        error: 'Failed to fetch liked samples',
        details: likesError.message 
      });
    }

    if (!likes || likes.length === 0) {
      return res.json({ samples: [] });
    }

    const sampleIds = likes.map(like => like.sample_id);

    const { data: samples, error: samplesError } = await supabase
      .from('samples')
      .select('*')
      .in('id', sampleIds);

    if (samplesError) {
      console.error('Fetch samples error:', samplesError);
      return res.status(500).json({ 
        error: 'Failed to fetch sample details',
        details: samplesError.message 
      });
    }

    const samplesWithUsers = await Promise.all(
      samples.map(async (sample) => {
        try {
          const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(sample.user_id);
          
          return {
            ...sample,
            user: {
              id: user?.id || sample.user_id,
              username: user?.user_metadata?.username || user?.email?.split('@')[0] || 'Unknown User',
              profile_picture: user?.user_metadata?.profile_picture || null,
              email: user?.email || null
            }
          };
        } catch (userError) {
          console.warn(`Failed to fetch user data for user_id: ${sample.user_id}`, userError);
          return {
            ...sample,
            user: {
              id: sample.user_id,
              username: 'Unknown User',
              profile_picture: null,
              email: null
            }
          };
        }
      })
    );

    const orderedSamples = sampleIds.map(id => 
      samplesWithUsers.find(sample => sample.id === id)
    ).filter(Boolean);

    res.json({ samples: orderedSamples });
  } catch (error) {
    console.error('Fetch user liked samples error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

router.get('/popular-samples', async (req, res) => {
  try {
    const { data: samples, error } = await supabase
      .from('samples')
      .select('*')
      .order('likes_count', { ascending: false })
      .limit(5);

    if (error) {
      return res.status(500).json({ 
        error: 'Failed to fetch popular samples',
        details: error.message 
      });
    }

    const samplesWithUsers = await Promise.all(
      samples.map(async (sample) => {
        try {
          const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(sample.user_id);
          
          return {
            ...sample,
            user: {
              id: user?.id || sample.user_id,
              username: user?.user_metadata?.username || user?.email?.split('@')[0] || 'Unknown User',
              profile_picture: user?.user_metadata?.profile_picture || null,
              email: user?.email || null
            }
          };
        } catch (userError) {
          console.warn(`Failed to fetch user data for user_id: ${sample.user_id}`, userError);
          return {
            ...sample,
            user: {
              id: sample.user_id,
              username: 'Unknown User',
              profile_picture: null,
              email: null
            }
          };
        }
      })
    );

    res.json({ samples: samplesWithUsers });
  } catch (error) {
    console.error('Fetch popular samples error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

router.get('/samples-with-users', async (req, res) => {
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

    const samplesWithUsers = await Promise.all(
      samples.map(async (sample) => {
        try {
          const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(sample.user_id);
          
          return {
            ...sample,
            user: {
              id: user?.id || sample.user_id,
              username: user?.user_metadata?.username || user?.email?.split('@')[0] || 'Unknown User',
              profile_picture: user?.user_metadata?.profile_picture || null,
              email: user?.email || null
            }
          };
        } catch (userError) {
          console.warn(`Failed to fetch user data for user_id: ${sample.user_id}`, userError);
          return {
            ...sample,
            user: {
              id: sample.user_id,
              username: 'Unknown User',
              profile_picture: null,
              email: null
            }
          };
        }
      })
    );

    res.json({ samples: samplesWithUsers });
  } catch (error) {
    console.error('Fetch samples with users error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

router.get('/comments/:sample_id', async (req, res) => {
  try {
    const { sample_id } = req.params;

    const { data: comments, error } = await supabase
      .from('comments')
      .select('*')
      .eq('sample_id', sample_id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ 
        error: 'Failed to fetch comments',
        details: error.message 
      });
    }

    const commentsWithUsers = await Promise.all(
      comments.map(async (comment) => {
        try {
          const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(comment.user_id);
          
          return {
            ...comment,
            user: {
              id: user?.id || comment.user_id,
              username: user?.user_metadata?.username || user?.email?.split('@')[0] || 'Unknown User',
              profile_picture: user?.user_metadata?.profile_picture || null,
              email: user?.email || null
            }
          };
        } catch (userError) {
          console.warn(`Failed to fetch user data for user_id: ${comment.user_id}`, userError);
          return {
            ...comment,
            user: {
              id: comment.user_id,
              username: 'Unknown User',
              profile_picture: null,
              email: null
            }
          };
        }
      })
    );

    res.json({ comments: commentsWithUsers });
  } catch (error) {
    console.error('Fetch comments error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

router.post('/comments', async (req, res) => {
  try {
    const { user_id, sample_id, comment } = req.body;

    if (!user_id || !sample_id || !comment) {
      return res.status(400).json({ 
        error: 'Missing required fields: user_id, sample_id, and comment' 
      });
    }

    const { data: commentData, error: insertError } = await supabaseAdmin
      .from('comments')
      .insert([
        {
          user_id,
          sample_id,
          comment: comment.trim()
        }
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      return res.status(500).json({ 
        error: 'Failed to post comment',
        details: insertError.message 
      });
    }

    const { data: commentsCount, error: countError } = await supabase
      .from('comments')
      .select('id', { count: 'exact' })
      .eq('sample_id', sample_id);

    if (!countError) {
      const newCommentsCount = commentsCount.length;
      await supabaseAdmin
        .from('samples')
        .update({ comments_count: newCommentsCount })
        .eq('id', sample_id);
    }

    res.status(201).json({
      success: true,
      message: 'Comment posted successfully!',
      comment: commentData
    });

  } catch (error) {
    console.error('Post comment error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

router.delete('/comments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ 
        error: 'User ID is required for deletion' 
      });
    }

    const { data: comment, error: fetchError } = await supabase
      .from('comments')
      .select('*')
      .eq('id', id)
      .eq('user_id', user_id)
      .single();

    if (fetchError || !comment) {
      return res.status(404).json({ 
        error: 'Comment not found or you do not have permission to delete it' 
      });
    }

    const sample_id = comment.sample_id;

    const { error: deleteError } = await supabaseAdmin
      .from('comments')
      .delete()
      .eq('id', id)
      .eq('user_id', user_id);

    if (deleteError) {
      console.error('Database delete error:', deleteError);
      return res.status(500).json({ 
        error: 'Failed to delete comment',
        details: deleteError.message 
      });
    }

    const { data: commentsCount, error: countError } = await supabase
      .from('comments')
      .select('id', { count: 'exact' })
      .eq('sample_id', sample_id);

    if (!countError) {
      const newCommentsCount = commentsCount.length;
      await supabaseAdmin
        .from('samples')
        .update({ comments_count: newCommentsCount })
        .eq('id', sample_id);
    }

    res.json({
      success: true,
      message: 'Comment deleted successfully!'
    });

  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

router.get('/user-expiring-samples/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dayAfterTomorrow = new Date();
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

    const { data: expiringSamples, error } = await supabase
      .from('samples')
      .select('id, title, expires_at, saved')
      .eq('user_id', user_id)
      .eq('saved', false) 
      .gte('expires_at', tomorrow.toISOString().split('T')[0])
      .lt('expires_at', dayAfterTomorrow.toISOString().split('T')[0]); 
    if (error) {
      console.error('Fetch expiring samples error:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch expiring samples',
        details: error.message 
      });
    }

    res.json({ 
      expiringSamples: expiringSamples || [],
      count: expiringSamples ? expiringSamples.length : 0
    });
  } catch (error) {
    console.error('Check expiring samples error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

export default router;