#!/usr/bin/env python3
"""
Download 2 photos + 2 ≤15-second videos for every campsite in the database.
Files are stored under:
  media/photos/<slug>/photo_1.jpg … photo_2.jpg
  media/videos/<slug>/video_1.mp4 … video_2.mp4
Replace PEXELS_API_KEY and DB_DSN with your own values.
"""
import os, re, requests, psycopg2, unicodedata

DB_DSN = "postgresql://postgres:postgres@localhost:5432/CampingTool"
PEXELS_API_KEY = "4ASODLqGfWD7W8loiQMobLZYSHqEBcWD2ZhQyhmnSCnpYxU9lZ7QZLXD"
HEADERS = {"Authorization": PEXELS_API_KEY}

###############################################################################
# helpers
###############################################################################
def slugify(text: str) -> str:
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    text = re.sub(r"[^\w\s-]", "", text).strip().lower()
    return re.sub(r"[-\s]+", "-", text)

def ensure_dir(path):
    if not os.path.isdir(path):
        os.makedirs(path, exist_ok=True)

def download(url, dest):
    if os.path.exists(dest):
        return
    try:
        with requests.get(url, stream=True, timeout=30) as r:
            r.raise_for_status()
            with open(dest, "wb") as f:
                for chunk in r.iter_content(chunk_size=8192):
                    f.write(chunk)
        print("✔", dest)
    except Exception as e:
        print("✘", dest, e)

###############################################################################
# core
###############################################################################
def media_for_campsite(name, n_photos=2, n_videos=2):
    query = f"{name} campsite"
    slug = slugify(name)

    photo_dir = f"media/photos/{slug}"
    video_dir = f"media/videos/{slug}"
    ensure_dir(photo_dir)
    ensure_dir(video_dir)

    # ---- photos ------------------------------------------------------------
    photos_dl = 0
    page = 1
    while photos_dl < n_photos:
        url = f"https://api.pexels.com/v1/search?query={query}&per_page=15&page={page}"
        photos = requests.get(url, headers=HEADERS).json().get("photos", [])
        if not photos:
            break
        for p in photos:
            if photos_dl >= n_photos:
                break
            photo_url = p["src"]["large2x"]
            dest = f"{photo_dir}/photo_{photos_dl+1}.jpg"
            download(photo_url, dest)
            photos_dl += 1
        page += 1

    # ---- videos ------------------------------------------------------------
    vids_dl = 0
    page = 1
    while vids_dl < n_videos:
        url = f"https://api.pexels.com/videos/search?query={query}&per_page=15&page={page}"
        videos = requests.get(url, headers=HEADERS).json().get("videos", [])
        if not videos:
            break
        for v in videos:
            if vids_dl >= n_videos:
                break
            if v["duration"] <= 15:
                video_url = v["video_files"][0]["link"]
                dest = f"{video_dir}/video_{vids_dl+1}.mp4"
                download(video_url, dest)
                vids_dl += 1
        page += 1

def main():
    with psycopg2.connect(DB_DSN) as con, con.cursor() as cur:
        cur.execute("SELECT name FROM campsites ORDER BY name;")
        for (name,) in cur.fetchall():
            print(f"\n=== {name} ===")
            media_for_campsite(name)

if __name__ == "__main__":
    main()
