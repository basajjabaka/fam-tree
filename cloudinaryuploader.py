import cloudinary
import cloudinary.uploader
import cloudinary.api
import os
from dotenv import load_dotenv

load_dotenv()

cloudinary.config(
  cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
  api_key=os.getenv("CLOUDINARY_API_KEY"),
  api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

def upload_image_with_original_filename(image_path, upload_preset):
    """
    Uploads a single image to Cloudinary using its original filename.

    Args:
        image_path: The local path to the image file.
        upload_preset: The Cloudinary upload preset to use.

    Returns:
        The public_id (which will be the original filename) if successful,
        None otherwise.
    """
    try:
        original_filename = os.path.splitext(os.path.basename(image_path))[0]
        upload_result = cloudinary.uploader.upload(
            image_path,
            upload_preset=upload_preset,
            public_id=original_filename,
            overwrite=True,
            invalidate=True,
            resource_type="auto"
        )
        return upload_result["public_id"]
    except Exception as e:
        print(f"Error uploading image {image_path}: {e}")
        return None

def upload_folder_images(folder_path, upload_preset):
    """
    Uploads all images in a folder to Cloudinary using their original filenames.

    Args:
        folder_path: The local path to the folder containing images.
        upload_preset: The Cloudinary upload preset to use.

    Returns:
        A list of public_ids (filenames) of the uploaded images.
    """
    uploaded_filenames = []
    for root, _, files in os.walk(folder_path):
        for file in files:
            if file.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.bmp')):
                image_path = os.path.join(root, file)
                filename = upload_image_with_original_filename(image_path, upload_preset)
                if filename:
                    uploaded_filenames.append(filename)
                    print(f"Uploaded: {filename}")
    return uploaded_filenames

def construct_image_url(filename):
    """
    Constructs the Cloudinary URL for an image using its public_id (filename).
    """
    return cloudinary.CloudinaryImage(filename).build_url()

def upload(path, upload_preset):
    """
    Uploads an image or a folder of images to Cloudinary.

    Args:
        path: The local path to the image file or folder.
        upload_preset: The Cloudinary upload preset to use.

    Returns:
        A single public_id (filename) if a file was uploaded,
        a list of public_ids (filenames) if a folder was uploaded,
        or None if the upload failed.
    """
    if os.path.isfile(path):
        return upload_image_with_original_filename(path, upload_preset)
    elif os.path.isdir(path):
        return upload_folder_images(path, upload_preset)
    else:
        print("Invalid path: Not a file or a folder.")
        return None

# Example Usage
if __name__ == "__main__":
    path_to_upload = r"C:\Users\noble\Documents\STANES\Project Files\Family-Tree\uploads"  # Replace with your path
    cloudinary_upload_preset = os.getenv("CLOUDINARY_UPLOAD_PRESET")

    result = upload(path_to_upload, cloudinary_upload_preset)

    if result:
        if isinstance(result, list):
            print("Uploaded images (filenames):")
            for filename in result:
                url = construct_image_url(filename)
                print(f"- {filename} - {url}")
        else:
            print(f"Image uploaded successfully. Filename: {result}")
            url = construct_image_url(result)
            print(f"URL: {url}")
    else:
        print("Upload failed.")