import { createWorker } from "tesseract.js";
import fs from "fs"
import sharp from "sharp";
import path from "path";

async function preprocessImage(inputPath) {
  const outputPath = inputPath.replace(/\.(jpg|jpeg|png)$/i, '_processed.png');
  
  try {
    await sharp(inputPath)
      // Convert to grayscale
      .grayscale()
      // Increase contrast and brightness
      .modulate({
        brightness: 1.2,
        contrast: 1.5
      })
      // Sharpen the image
      .sharpen({
        sigma: 1,
        m1: 1,
        m2: 2
      })
      // Resize to improve OCR (make text larger)
      .resize({
        width: 1200,
        height: 1600,
        fit: 'inside',
        withoutEnlargement: false
      })
      // Apply threshold to create pure black/white
      .threshold(128)
      .png()
      .toFile(outputPath);
    
    console.log('Image preprocessed successfully');
    return outputPath;
  } catch (error) {
    console.error('Image preprocessing error:', error);
    return inputPath; // Return original if preprocessing fails
  }
}

async function extractSurveyCodeEnhanced(imagePath) {
  let processedImagePath = imagePath;
  
  try {
    // Preprocess the image
    processedImagePath = await preprocessImage(imagePath);
    
    const worker = await createWorker('eng');
    
    // Configure Tesseract for receipt text
    await worker.setParameters({
      tessedit_char_whitelist: '0123456789-ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz:() ',
      tessedit_pageseg_mode: '6', // Uniform block of text
      tessedit_ocr_engine_mode: '2', // Use LSTM OCR Engine
    });
    
    const { data: { text } } = await worker.recognize(processedImagePath);
    await worker.terminate();
    
    console.log('Enhanced OCR Text:');
    console.log(text);
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Multiple extraction patterns
    const patterns = [
      /\b\d{5}-\d{5}-\d{5}-\d{5}-\d{5}-\d\b/g,
      /Survey Code[:\s]+([0-9-]+)/gi,
      /Code[:\s]+([0-9-]+)/gi,
      /\b[\d-]{29,33}\b/g, // Specific length for McDonald's codes
    ];
    
    for (let i = 0; i < patterns.length; i++) {
      const matches = text.match(patterns[i]);
      if (matches) {
        let code = matches[0];
        // Clean up the match if it includes label
        if (i > 0) {
          const cleanMatch = code.match(/[0-9-]+/);
          if (cleanMatch) code = cleanMatch[0];
        }
        console.log(`Survey Code Found (pattern ${i + 1}):`, code);
        return code;
      }
    }
    
    return null;
    
  } catch (error) {
    console.error('Enhanced OCR Error:', error);
    return null;
  } finally {
    // Clean up processed image
    if (processedImagePath !== imagePath && fs.existsSync(processedImagePath)) {
      fs.unlinkSync(processedImagePath);
    }
  }
}

// Alternative: Manual region extraction for just the survey code area
async function extractSurveyCodeFromRegion(imagePath, region = null) {
  let croppedImagePath = imagePath;
  
  try {
    if (region) {
      // Crop to specific region containing survey code
      croppedImagePath = imagePath.replace(/\.(jpg|jpeg|png)$/i, '_cropped.png');
      await sharp(imagePath)
        .extract(region) // {left: x, top: y, width: w, height: h}
        .grayscale()
        .modulate({ brightness: 1.3, contrast: 1.8 })
        .sharpen()
        .threshold(120)
        .png()
        .toFile(croppedImagePath);
    }
    
    const worker = await createWorker('eng');
    await worker.setParameters({
      tessedit_char_whitelist: '0123456789-',
      tessedit_pageseg_mode: '7', // Single text line
    });
    
    const { data: { text } } = await worker.recognize(croppedImagePath);
    await worker.terminate();
    
    console.log('Region OCR Text:', text.trim());
    
    // Extract just the numbers and dashes
    const cleanText = text.replace(/[^0-9-]/g, '');
    if (cleanText.length >= 29) {
      console.log('Survey Code from Region:', cleanText);
      return cleanText;
    }
    
    return null;
    
  } catch (error) {
    console.error('Region OCR Error:', error);
    return null;
  } finally {
    // Clean up cropped image
    if (croppedImagePath !== imagePath && fs.existsSync(croppedImagePath)) {
      fs.unlinkSync(croppedImagePath);
    }
  }
}

async function main() {
  const imagePath = './receipt.jpg';
  
  console.log('Trying enhanced Tesseract with preprocessing...\n');
  let surveyCode = await extractSurveyCodeEnhanced(imagePath);
  
  if (!surveyCode) {
    console.log('\nTrying region-specific extraction...\n');
    // You can specify a region if you know roughly where the survey code is
    // For McDonald's receipts, it's usually in the middle section
    const region = { left: 50, top: 600, width: 400, height: 100 };
    surveyCode = await extractSurveyCodeFromRegion(imagePath, region);
  }
  
  if (surveyCode) {
    console.log('\n✅ Final Survey Code:', surveyCode);
  } else {
    console.log('\n❌ Could not extract survey code');
  }
}

main()
