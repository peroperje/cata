import os.path
import base64
import email.utils
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# If modifying these scopes, delete the file token.json.
SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']

class GmailClient:
    def __init__(self, credentials_path='credentials.json', token_path='token.json'):
        self.credentials_path = credentials_path
        self.token_path = token_path
        self.creds = None
        self._authenticate()

    def _authenticate(self):
        if os.path.exists(self.token_path):
            self.creds = Credentials.from_authorized_user_file(self.token_path, SCOPES)
        
        # If there are no (valid) credentials available, let the user log in.
        if not self.creds or not self.creds.valid:
            if self.creds and self.creds.expired and self.creds.refresh_token:
                try:
                    self.creds.refresh(Request())
                except Exception as e:
                    print(f"Error refreshing credentials: {e}")
                    self.creds = None
            
                if not os.path.exists(self.credentials_path):
                    raise FileNotFoundError(f"Missing {self.credentials_path}. Please provide it in the apps/gmail-api directory.")
                
                print("\n" + "!"*60)
                print("GMAIL AUTHENTICATION REQUIRED")
                print("Google OAuth2 policy prevents authorization from within a Docker container using 0.0.0.0.")
                print("Please run the following command ON YOUR HOST MACHINE (not in docker):")
                print("\n    python apps/gmail-api/scripts/generate_token.py\n")
                print("This will generate the 'token.json' file needed for this service.")
                print("!"*60 + "\n")
                
                # We stop here and wait for the user to provide the token
                raise Exception("Authentication required. Please run the generate_token.py script on your host.")
            
            # Save the credentials for the next run
            with open(self.token_path, 'w') as token:
                token.write(self.creds.to_json())

    def get_service(self):
        return build('gmail', 'v1', credentials=self.creds)

    def list_messages(self, query='', max_results=50):
        try:
            service = self.get_service()
            results = service.users().messages().list(userId='me', q=query, maxResults=max_results).execute()
            messages = results.get('messages', [])
            return messages
        except HttpError as error:
            print(f'An error occurred: {error}')
            return []

    def get_message_content(self, msg_id):
        try:
            service = self.get_service()
            message = service.users().messages().get(userId='me', id=msg_id, format='full').execute()
            
            payload = message.get('payload')
            headers = payload.get('headers')
            
            subject = ''
            date_str = ''
            sender_email = ''
            for header in headers:
                if header.get('name') == 'Subject':
                    subject = header.get('value')
                if header.get('name') == 'Date':
                    date_str = header.get('value')
                if header.get('name') == 'From':
                    _, sender_email = email.utils.parseaddr(header.get('value'))
            
            sent_at = None
            if date_str:
                try:
                    sent_at = email.utils.parsedate_to_datetime(date_str)
                except Exception as e:
                    print(f"Error parsing date {date_str}: {e}")
            
            content = ""
            if 'parts' in payload:
                for part in payload['parts']:
                    if part['mimeType'] == 'text/html':
                        data = part['body'].get('data')
                        if data:
                            content = base64.urlsafe_b64decode(data).decode()
                            break
                    elif part['mimeType'] == 'text/plain' and not content:
                        data = part['body'].get('data')
                        if data:
                            content = base64.urlsafe_b64decode(data).decode()
            else:
                data = payload['body'].get('data')
                if data:
                    content = base64.urlsafe_b64decode(data).decode()
            
            return {
                "subject": subject,
                "content": content,
                "sender": sender_email or "unknown@sources.com",
                "sent_at": sent_at.isoformat() if sent_at else None
            }
        except Exception as error:
            print(f'An error occurred: {error}')
            return None
