# Maria Aslanyan — Personal Website

A minimal, dark editorial personal portfolio website built with Flask (Python) + HTML/CSS/JS.

## Project Structure

```
maria_website/
├── app.py                  # Flask backend
├── requirements.txt
├── templates/
│   └── index.html          # Main HTML template
└── static/
    ├── css/
    │   └── style.css       # All styles
    ├── js/
    │   └── main.js         # Animations & interactions
    └── assets/
        ├── maria.jpg       # Profile photo
        └── CV_Maria_Aslanyan.pdf
```

## Setup & Run

1. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the Flask server**
   ```bash
   python app.py
   ```

3. **Open in browser**
   ```
   http://localhost:5000
   ```

## Features

- Dark editorial design inspired by minimal portfolio aesthetics
- Custom cursor with smooth follower animation
- Scroll-triggered reveal animations (IntersectionObserver)
- Parallax effect on hero photo
- Text scramble effect on name
- 3D tilt effect on skill cards
- Animated buttons (translateY on hover)
- Fully responsive (mobile-friendly)
- Noise texture overlay for depth
- Cormorant Garamond serif + DM Mono font pairing
