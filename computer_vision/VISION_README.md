# Dakota Vision Model Integration

This document explains how to use the Dakota Vision Model feature for emotion detection and facial analysis.

## Features

- **Real-time Camera Access**: Use your device's camera to capture images for analysis
- **Image Upload**: Upload images from your device for processing
- **Emotion Detection**: AI-powered emotion recognition with confidence scores
- **Facial Landmark Detection**: Visual overlay of detected facial features
- **Glassmorphic UI**: Beautiful, modern interface that matches Dakota's design

## How to Use

### 1. Activate Vision Mode
1. Click the **"Vision Model"** button in the header
2. The vision panel will slide out from the right side
3. You'll see two panels: Input (left) and Results (right)

### 2. Camera Analysis
1. Click the **video camera icon** to start your device's camera
2. Allow camera permissions when prompted
3. Your live camera feed will appear in the input panel
4. Click the **camera icon** to capture a frame for analysis
5. Results will appear in the right panel within seconds

### 3. Image Upload
1. Click the **upload icon** to select an image from your device
2. Choose an image file (JPG, PNG, etc.)
3. The image will be automatically processed
4. Results will display in the right panel

### 4. Understanding Results
- **Emotion Detected**: Shows the primary emotion (Angry, Sad, Neutral, Happy, Very Happy)
- **Confidence Score**: Numerical confidence rating (-2 to +2 scale)
- **Processed Image**: Shows the original image with facial landmarks overlay (when available)
- **Service Status**: Indicates if using real AI or mock mode

## Technical Setup

### Frontend (Already Configured)
The vision model UI is integrated into the main Dakota interface with:
- Responsive design that works on desktop and mobile
- Camera API integration with proper error handling
- File upload capabilities with image validation
- Real-time results display with beautiful animations

### Backend Integration
The Node.js server includes:
- `/api/vision/analyze` endpoint for image processing
- Multer middleware for handling file uploads
- Integration with Python computer vision service
- Fallback to mock responses when Python service is unavailable

### Python Vision Service (Optional)
To enable full AI capabilities:

1. **Install Dependencies**:
   ```bash
   cd computer_vision
   pip install -r requirements.txt
   ```

2. **Start the Service**:
   ```bash
   python start_vision_service.py
   ```
   Or using gunicorn:
   ```bash
   gunicorn main:app --bind 0.0.0.0:8080
   ```

3. **Service Status**:
   - If running: Full AI emotion detection with facial landmarks
   - If offline: Mock responses for testing the interface

## Supported Image Formats
- JPEG/JPG
- PNG
- GIF
- WebP
- BMP

## Browser Compatibility
- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

Camera access requires HTTPS in production environments.

## Troubleshooting

### Camera Not Working
- Check browser permissions for camera access
- Ensure you're on HTTPS (required for camera in production)
- Try refreshing the page and allowing permissions again

### Analysis Not Working
- Check if Python vision service is running on port 8080
- Look at browser console and server logs for error messages
- Verify image file is a supported format

### Mock Mode Only
- This means the Python vision service isn't running
- The interface still works but shows random emotions for testing
- Start the Python service for real AI analysis

## API Usage

For developers wanting to integrate with the vision API directly:

```javascript
// Upload image for analysis
const formData = new FormData();
formData.append('image', imageFile);

fetch('/api/vision/analyze', {
    method: 'POST',
    body: formData
})
.then(response => response.json())
.then(data => {
    console.log('Emotion:', data.emotion_numeric);
    console.log('Processed image:', data.image_base64);
});
```

## Privacy & Security
- Images are processed locally on your server
- No data is sent to external services (when using local Python service)
- Temporary files are automatically cleaned up after processing
- Camera streams are not recorded or stored