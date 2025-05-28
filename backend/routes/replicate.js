import express from 'express';
import axios from 'axios';
import replicate from '../config/replicate.js';

const router = express.Router();

router.post('/generate', async (req, res) => {
  const { prompt } = req.body;

  try {
    // Step 1: Clean and correct the prompt using Llama
    const cleanedPromptResponse = await replicate.run("meta/meta-llama-3-70b-instruct", {
      input: {
        prompt: `Rewrite this music prompt so it is grammatically correct and clearly describes a melody only (no drums or percussion). Respond with the corrected prompt only — no explanation, no intro, just the prompt:\n\n"${prompt}"`,
        system_prompt: "You are a music AI assistant that rewrites prompts for generating melodies only — no beats or percussion.",
        max_new_tokens: 60,
      },
    });

    const cleanedPrompt = cleanedPromptResponse.join("").trim().replace(/^["']+|["'.]+$/g, '');

    // Step 2: Generate two different titles for the samples
    const titlePromises = [
      replicate.run("meta/meta-llama-3-70b-instruct", {
        input: {
          prompt: `Give me only a short and creative music title (maximum 5 words) based on the following prompt. Make it unique and catchy. No explanation. Just the title.\n\nPrompt: "${cleanedPrompt}"`,
          system_prompt: "You are a creative assistant that creates unique titles for music samples.",
          max_new_tokens: 20,
        },
      }),
      replicate.run("meta/meta-llama-3-70b-instruct", {
        input: {
          prompt: `Create a different short and creative music title (maximum 5 words) for this prompt. Make it distinctive from other titles. No explanation. Just the title.\n\nPrompt: "${cleanedPrompt}"`,
          system_prompt: "You are a creative assistant that creates diverse and unique titles for music samples.",
          max_new_tokens: 20,
        },
      })
    ];

    const [titleResponse1, titleResponse2] = await Promise.all(titlePromises);
    
    const title1 = titleResponse1.join("").trim().replace(/^["']+|["'.]+$/g, '');
    const title2 = titleResponse2.join("").trim().replace(/^["']+|["'.]+$/g, '');

    // Step 3: Generate two samples using the corrected prompt
    const input = {
      prompt: cleanedPrompt,
      model_version: "stereo-large",
      duration: 16,
      output_format: "mp3",
      normalization_strategy: "peak",
    };

    // Create two predictions simultaneously
    const predictionPromises = [
      replicate.predictions.create({
        version: "671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb",
        input,
      }),
      replicate.predictions.create({
        version: "671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb",
        input,
      })
    ];

    const [prediction1, prediction2] = await Promise.all(predictionPromises);

    // Wait for both predictions to complete
    const waitForCompletion = async (predictionId) => {
      let result = await replicate.predictions.get(predictionId);
      while (!["succeeded", "failed", "canceled"].includes(result.status)) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        result = await replicate.predictions.get(result.id);
      }
      return result;
    };

    const [result1, result2] = await Promise.all([
      waitForCompletion(prediction1.id),
      waitForCompletion(prediction2.id)
    ]);

    // Check if both generations succeeded
    if (result1.status === "succeeded" && result2.status === "succeeded") {
      res.json({
        samples: [
          {
            audio: result1.output,
            title: title1,
            prompt: cleanedPrompt
          },
          {
            audio: result2.output,
            title: title2,
            prompt: cleanedPrompt
          }
        ],
        originalPrompt: prompt,
        correctedPrompt: cleanedPrompt,
        success: true
      });
    } else {
      // Handle partial failures
      const samples = [];
      
      if (result1.status === "succeeded") {
        samples.push({
          audio: result1.output,
          title: title1,
          prompt: cleanedPrompt
        });
      }
      
      if (result2.status === "succeeded") {
        samples.push({
          audio: result2.output,
          title: title2,
          prompt: cleanedPrompt
        });
      }

      if (samples.length > 0) {
        res.json({
          samples,
          originalPrompt: prompt,
          correctedPrompt: cleanedPrompt,
          success: true,
          warning: "Some samples failed to generate"
        });
      } else {
        res.status(500).json({ 
          error: "Both sample generations failed", 
          status1: result1.status,
          status2: result2.status,
          success: false
        });
      }
    }

  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).json({ 
      error: "Something went wrong during generation",
      success: false
    });
  }
});

router.get('/proxy-audio', async (req, res) => {
  const audioUrl = req.query.url;
  
  if (!audioUrl) {
    return res.status(400).json({ error: "Missing audio URL" });
  }

  try {
    const response = await axios.get(audioUrl, { responseType: "stream" });
    res.setHeader("Content-Type", "audio/mpeg");
    response.data.pipe(res);
  } catch (error) {
    console.error("Proxy error:", error.message);
    res.status(500).json({ error: "Failed to stream audio" });
  }
});

export default router;