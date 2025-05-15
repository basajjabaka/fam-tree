# TreeNest - Family Tree Web Application

## Demo

Visit the live demo: [TreeNest - Anchery Family](https://ancheryfamily.onrender.com)

## Description

TreeNest is a comprehensive family tree web application designed to help families document, explore, and preserve their heritage. The application allows users to create profiles, track relationships, view nearby family members, and explore family history.

## Features

- **Family Member Profiles**: Create and manage detailed profiles with photos, contact information, and relationships
- **Birthday Notifications**: Get alerts for upcoming family birthdays
- **Nearby Families**: Find family members located near you using Google Maps integration
- **Family History**: Document and explore your family's history and heritage
- **Admin Panel**: Manage family data and user access
- **Text-to-Speech**: Listen to family stories and information using Google's TTS
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: React.js, Vite, React Router
- **Backend**: Express.js, Node.js
- **Database**: MongoDB
- **Image Storage**: Cloudinary
- **Mapping**: Google Maps API
- **Text-to-Speech**: Google Cloud Text-to-Speech
- **Styling**: CSS, React-Slick

## Installation

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- Python 3.x (for utility scripts)

### Setup Instructions

1. **Clone the repository**

```bash
git clone https://github.com/staneswilson/TreeNest.git
cd TreeNest
```

2. **Install dependencies**

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

3. **Set up environment variables**

Create a `.env` file in the root directory:

```env
# API Configuration
VITE_API_BASE_URL=
VITE_USER_IDS=

# MongoDB Configuration
DB_NAME=treenest
MONGO_URI=

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_UPLOAD_PRESET=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Google Maps Configuration
GOOGLE_MAPS_API_KEY=
GOOGLE_APPLICATION_CREDENTIALS=
```

### Environment Variables Explanation

- **VITE_API_BASE_URL**: The URL where your backend server is running. Use the default for local development.

- **VITE_USER_IDS**: MongoDB \_id values of initial family members. These IDs correspond to family member documents in your database that will be displayed when the application first loads.

- **DB_NAME**: The name of your MongoDB database. Default is "treenest".

- **MONGO_URI**: Connection string for MongoDB. Use the local connection for development or your MongoDB Atlas URI for production.

- **Cloudinary Configuration**:

  - **CLOUDINARY_CLOUD_NAME**: Your Cloudinary cloud name from dashboard
  - **CLOUDINARY_UPLOAD_PRESET**: Name of the upload preset configured in Cloudinary settings
  - **CLOUDINARY_API_KEY**: API key from Cloudinary dashboard
  - **CLOUDINARY_API_SECRET**: API secret from Cloudinary dashboard

- **Google Configuration**:
  - **GOOGLE_MAPS_API_KEY**: API key from Google Cloud Console with Maps JavaScript API enabled
  - **GOOGLE_APPLICATION_CREDENTIALS**: Path to Google Cloud service account credentials JSON file for Text-to-Speech functionality

4. **Start the application**

```bash
# Start backend server
cd backend
node index.js

# In a separate terminal, start frontend
npm run dev
```

5. **Access the application**

Open your browser and navigate to `http://localhost:5173` (or the port shown in your terminal).

## Utility Scripts

This project includes several Python utilities to help manage your family data:

### Cloudinary Uploader (`utils/cloudinaryuploader.py`)

Used to bulk upload images to Cloudinary from local folders.

```bash
# How to use
python utils/cloudinaryuploader.py
```

**Functions:**

- `upload_image_with_original_filename(image_path, upload_preset)`: Upload a single image to Cloudinary while preserving its original filename
- `upload_folder_images(folder_path, upload_preset)`: Bulk upload all images from a specified folder to Cloudinary

**Setup Before Running:**

1. Ensure your `.env` file has valid Cloudinary credentials
2. Edit the script to specify the folder path containing your images
3. Make sure the upload preset is configured in your Cloudinary account

### Data Extractor (`utils/extractor.py`)

Tool to extract family data from Excel sheets and import into MongoDB.

```bash
# How to use
python utils/extractor.py
```

**Setup Before Running:**

1. Ensure you have your Excel data file with family information in the correct format:
   - Excel sheet should have columns for names, DOB, phone numbers, and other family information
   - Headers should match the fields used in the MongoDB schema
   - _Check [Sample Excel Sheet](utils/sample_data.xlsx)_
2. Set `SHEET_NAME` in the script to match your Excel sheet name
3. Update the file path in the script to point to your Excel file:
   ```python
   file_path = Path(r'path\to\your\excel_file.xlsx')
   ```
4. Make sure your MongoDB connection in the `.env` file is working correctly
5. Review the `clean_field` and `clean_phone_number` functions for any customizations needed

## Deployment

For production deployment:

1. Build the frontend:

```bash
npm run build
```

2. Deploy the backend and static files to your hosting service (like Render, Heroku, Vercel, etc.)

### Deployment to Render

This application is currently deployed on [Render](https://render.com). To deploy your own instance:

1. Push your code to a GitHub repository
2. Create a new Web Service on Render
3. Connect your GitHub repository
4. Configure the build command: `npm install && npm run build`
5. Configure the start command: `cd backend && npm install && node index.js`
6. Add all the environment variables from your `.env` file to the Render environment
7. Deploy and wait for the build to complete

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For questions or support, please contact [staneswilson2006@gmail.com](mailto:staneswilson2006@gmail.com)
