import os
import requests
from typing import List, Dict
from domain.interfaces import IJobSearchClient
from domain.models import JobOffer

class AdzunaClient(IJobSearchClient):
    def __init__(self):
        self.app_id = os.getenv("ADZUNA_APP_ID")
        self.app_key = os.getenv("ADZUNA_APP_KEY")
        self.base_url = "https://api.adzuna.com/v1/api/jobs/it/search/1"

    def save(self, job_offer: JobOffer) -> str:
        # Adzuna is a read-only API in this context, but we provide the implementation to satisfy the interface
        return "AdzunaClient: save not implemented for external API"

    def get_by_user(self, user_id: str) -> List[JobOffer]:
        # Adzuna is a search-based API, returning empty list for get_by_user for now
        return []

    def search_jobs(self, query: str, results_page: int = 3) -> List[Dict]:
        params = {
            "app_id": self.app_id,
            "app_key": self.app_key,
            "what": query
        }
        try:
            response = requests.get(self.base_url, params=params)
            print(f"📡 Status: {response.status_code}")
            print(f"📦 Response: {response.text[:500]}")
            if response.status_code != 200:
                return []
            
            data = response.json()
            jobs = data.get("results", [])[:5]

            results = []
            for job in jobs:
                results.append({
                    "title": job["title"],
                    "company": job["company"]["display_name"] if isinstance(job["company"], dict) else job["company"],
                    "location": job["location"]["display_name"] if isinstance(job["location"], dict) else job["location"],
                    "url": job["redirect_url"]
                })
            return results
        except Exception:
            return []
