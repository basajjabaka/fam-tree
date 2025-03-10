import os
import re
import pandas as pd
from dotenv import load_dotenv
from pathlib import Path
from pymongo import MongoClient

load_dotenv(".env")
dburi = os.getenv("MONGO_URI")
# MongoDB setup
client = MongoClient(dburi)
db = client["ancheryfamily"]
collection = db["familymembers"]

SHEET_NAME = "Thankammayi"# Excel Sheet name

def clean_phone_number(phone):
    """Clean phone number by removing invalid values and returning empty string."""
    if pd.isna(phone) or str(phone).upper() in ['NAN', 'NIL', 'NONE', ''] or phone is None:
        return ""
    return str(phone).strip()

def clean_field(value):
    """Clean field by returning None if the value is NaN or empty."""
    if pd.isna(value) or str(value).upper() in ['NAN', 'NIL', 'NONE','?', '']:
        return None
    return value

# Load the data file
file_path = Path(r'c:\Users\noble\Downloads\family Diary_Dec 2024_CC_Mar1st.xlsx')
df = pd.read_excel(file_path, sheet_name=SHEET_NAME)
df = df.loc[:, ~df.columns.str.contains('^Unnamed')]
df = df.dropna(how='all')
df = df.dropna(axis=1, how='all')
df = df.reset_index(drop=True)

for col in df.columns:
    if 'phone' in col.lower():
        df[col] = df[col].astype(str).str.replace(r'\..*', '', regex=True)

data = []
member_dict = {}

for index, row in df.iterrows():
    member_ids = []
    
    # Split the address field based on numeric markers
    addresses = {}
    if pd.notna(row['Address']):
        # Remove newlines before splitting to handle multi-line addresses
        clean_address = str(row['Address']).replace('\n', ' ')
        address_parts = re.split(r'(\d+\.)', clean_address)
        current_index = None
        current_address = []
        
        for part in address_parts:
            if re.match(r'\d+\.', part):
                if current_index is not None:
                    addresses[current_index] = ' '.join(current_address).strip()
                current_index = int(part.strip('.'))
                current_address = []
            else:
                current_address.append(part.strip())
        
        if current_index is not None:
            addresses[current_index] = ' '.join(current_address).strip()

    print(f"Row {index} addresses: {addresses}")

    # Loop through possible family member fields
    i = 1
    while True:
        name_col = f'Name{i}'
        dob_col = f'Date of Birth{i}'
        occupation_col = f'Occupation{i}'
        phone_col = f'Phone{i}'
        image_col = 'Images'

        if name_col not in row or pd.isna(row[name_col]):
            break

        # Get the corresponding address for this member index
        current_address = addresses.get(i, None)
        
        # Handle phone number with the clean_phone_number function
        phone = clean_phone_number(row.get(phone_col, ""))
        occupation = clean_field(row.get(occupation_col, None))
        
        member_data = {
            'name': (row[name_col]).strip(),
            'dob': pd.to_datetime(row.get(dob_col, None), dayfirst=True),
            'phone': phone,
            'occupation': occupation,
            'address': current_address,
            'image': clean_field(row.get(image_col, None)),
            'spouse': None,
            'children': []
        }

        print(f"Processing member: {member_data}")

        # Check if the member already exists in the database
        existing_member = collection.find_one({
            'name': member_data['name'],
            'dob': member_data['dob']
        })
        
        if existing_member:
            member_id = existing_member['_id']
            # Update member data, including empty children list
            update_data = {
                "address": current_address if current_address else existing_member.get('address'),
                "phone": phone,# Update phone number
                "occupation": occupation,# Update occupation
                "children": []  # Reset children list
            }
            # Update the image only if a new image is provided
            if member_data['image']:
                update_data["image"] = member_data['image']
            collection.update_one(
                {"_id": member_id},
                {"$set": update_data}
            )
        else:
            result = collection.insert_one(member_data)
            member_id = result.inserted_id

        member_ids.append(member_id)
        member_dict[(member_data['name'], member_data['dob'])] = member_id

        i += 1

    # Update relationships
    for idx, member_id in enumerate(member_ids):
        if idx == 1:  # Spouse
            collection.update_one({"_id": member_id}, {"$set": {"spouse": member_ids[0]}})
            collection.update_one({"_id": member_ids[0]}, {"$set": {"spouse": member_id}})
        elif idx > 1:  # Children
            # Add child to parent's children list
            collection.update_one(
                {"_id": member_ids[0]}, 
                {"$addToSet": {"children": member_id}}  # Use addToSet instead of push to avoid duplicates
            )
            # Add child to the second member's children list if they are married
            if len(member_ids) > 2:
                collection.update_one(
                    {"_id": member_ids[1]}, 
                    {"$addToSet": {"children": member_id}}  # Use addToSet instead of push to avoid duplicates
                )

print("Family tree data has been successfully inserted into MongoDB.")