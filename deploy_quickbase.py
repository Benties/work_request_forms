from dotenv import load_dotenv
import os
import requests

load_dotenv()  # Load variables from .env
# Retrieve Quickbase credentials from environment variables.
usertoken = os.environ.get("QUICKBASE_USER_TOKEN")
apptoken = os.environ.get("QUICKBASE_APP_TOKEN")
dbid = os.environ.get("QUICKBASE_DBID")
domain = os.environ.get("QUICKBASE_DOMAIN")  # e.g., "yourrealm.quickbase.com"

# Folder containing your code page files.
folder_path = "Code Pages"

# Define the page type:
# 1 is for XSL/HTML pages, and 3 is for Exact Forms.
pagetype = 1

# Construct the API URL for Quickbase.
url = f"https://{domain}/db/{dbid}"

# Set up the necessary HTTP headers.
headers = {
    "Content-Type": "application/xml",
    "QUICKBASE-ACTION": "API_AddReplaceDBPage"
}

# Iterate over each file in the "Code Pages" folder.
for filename in os.listdir(folder_path):
    file_path = os.path.join(folder_path, filename)
    if os.path.isfile(file_path):
        # Read the content of the file.
        with open(file_path, "r") as file:
            code_content = file.read()

        # Use the file name as the page name.
        page_identifier = f"<pagename>{filename}</pagename>"

        # Construct the XML payload with the file content wrapped in a CDATA block.
        xml_payload = f"""<?xml version="1.0" encoding="UTF-8"?>
<qdbapi>
  {page_identifier}
  <pagetype>{pagetype}</pagetype>
  <pagebody><![CDATA[
{code_content}
  ]]></pagebody>
  <usertoken>{usertoken}</usertoken>
  <apptoken>{apptoken}</apptoken>
</qdbapi>
"""
        print(f"Deploying page for file: {filename}")

        # Make the API call to deploy the page.
        response = requests.post(url, data=xml_payload, headers=headers)

        if response.status_code == 200:
            print(f"Deployment successful for {filename}!")
            print(response.text)
        else:
            print(f"Deployment failed for {filename} with status code {response.status_code}")
            print(response.text)
