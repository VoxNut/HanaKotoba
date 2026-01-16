"""
Mokuro Integration Service for Manga OCR

This module integrates the Mokuro library (https://github.com/kha-white/mokuro)
for manga text extraction and provides enhanced results with pitch accent and translation.

Mokuro uses:
- comic-text-detector for text box detection
- manga-ocr for Japanese OCR

The correct API is:
    from mokuro import MangaPageOcr
    mpocr = MangaPageOcr()
    result = mpocr(image_path)  # Returns dict with blocks
"""

import base64
import tempfile
import uuid
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# Try to import mokuro's MangaPageOcr
try:
    from mokuro import MangaPageOcr
    MOKURO_AVAILABLE = True
except ImportError:
    MOKURO_AVAILABLE = False
    MangaPageOcr = None
    logger.warning("Mokuro not installed. Install with: pip install mokuro")

# Fallback: Try to import manga-ocr directly
try:
    from manga_ocr import MangaOcr
    MANGA_OCR_AVAILABLE = True
except ImportError:
    MANGA_OCR_AVAILABLE = False
    MangaOcr = None


@dataclass
class TextBox:
    """Represents a detected text box in a manga page."""
    id: str
    text: str
    x: float  # Percentage (0-100) from left
    y: float  # Percentage (0-100) from top
    width: float  # Percentage width
    height: float  # Percentage height
    confidence: float
    vertical: bool  # Japanese vertical text
    lines: list  # Individual lines of text (for proper multi-column display)
    font_size: float  # Detected font size in pixels


@dataclass
class MangaPageResult:
    """Result of processing a manga page."""
    page_id: str
    image_path: str
    text_boxes: list[TextBox]
    raw_text: str  # All text concatenated
    img_width: int  # Original image width in pixels
    img_height: int  # Original image height in pixels


class MokuroService:
    """
    Service for processing manga images using Mokuro's MangaPageOcr.
    
    MangaPageOcr provides:
    - Text box detection using comic-text-detector
    - OCR for Japanese manga text using manga-ocr
    - Support for vertical and horizontal text
    """
    
    _instance: Optional['MokuroService'] = None
    _mpocr: Optional[object] = None
    _manga_ocr: Optional[object] = None
    _initialized: bool = False
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        """Initialize Mokuro service (lazy loading)."""
        pass
    
    def _ensure_initialized(self):
        """Ensure Mokuro models are loaded."""
        if self._initialized:
            return
            
        if MOKURO_AVAILABLE and self._mpocr is None:
            try:
                logger.info("Initializing MangaPageOcr (this may take a moment to download models)...")
                # MangaPageOcr combines comic-text-detector + manga-ocr
                self._mpocr = MangaPageOcr(
                    pretrained_model_name_or_path="kha-white/manga-ocr-base",
                    force_cpu=False,  # Use GPU if available
                )
                logger.info("MangaPageOcr initialized successfully")
                self._initialized = True
            except Exception as e:
                logger.error(f"Failed to initialize MangaPageOcr: {e}")
                # Fall through to manga-ocr fallback
        
        # Fallback to manga-ocr only (no text detection)
        if not self._initialized and MANGA_OCR_AVAILABLE and self._manga_ocr is None:
            try:
                logger.info("Falling back to MangaOcr (no text detection)...")
                self._manga_ocr = MangaOcr()
                logger.info("MangaOcr initialized successfully")
                self._initialized = True
            except Exception as e:
                logger.error(f"Failed to initialize MangaOcr: {e}")
    
    def is_available(self) -> bool:
        """Check if Mokuro/MangaOCR is available."""
        return MOKURO_AVAILABLE or MANGA_OCR_AVAILABLE
    
    def process_image(self, image_data: bytes, filename: str = "manga.jpg") -> MangaPageResult:
        """
        Process a manga image and extract text boxes.
        
        Args:
            image_data: Raw image bytes
            filename: Original filename for extension detection
            
        Returns:
            MangaPageResult with detected text boxes
        """
        self._ensure_initialized()
        
        if not self.is_available():
            raise RuntimeError(
                "Neither Mokuro nor MangaOCR is available. "
                "Install with: pip install mokuro"
            )
        
        # Create temp file for processing
        with tempfile.NamedTemporaryFile(
            suffix=Path(filename).suffix or '.jpg', 
            delete=False
        ) as temp_file:
            temp_file.write(image_data)
            temp_path = temp_file.name
        
        try:
            page_id = str(uuid.uuid4())
            
            if MOKURO_AVAILABLE and self._mpocr:
                return self._process_with_mokuro(temp_path, page_id)
            elif MANGA_OCR_AVAILABLE and self._manga_ocr:
                return self._process_with_manga_ocr(temp_path, page_id, image_data)
            else:
                raise RuntimeError("No OCR backend initialized")
        finally:
            # Clean up temp file
            try:
                Path(temp_path).unlink()
            except Exception:
                pass
    
    def _process_with_mokuro(self, image_path: str, page_id: str) -> MangaPageResult:
        """
        Process image using MangaPageOcr.
        
        MangaPageOcr returns:
        {
            "version": "0.2.x",
            "img_width": W,
            "img_height": H,
            "blocks": [
                {
                    "box": [x1, y1, x2, y2],
                    "vertical": True/False,
                    "font_size": float,
                    "lines_coords": [...],
                    "lines": ["text line 1", "text line 2", ...]
                }
            ]
        }
        """
        try:
            logger.info(f"Processing image with MangaPageOcr: {image_path}")
            
            # Call MangaPageOcr - it's callable
            result = self._mpocr(image_path)
            
            img_width = result.get('img_width', 1)
            img_height = result.get('img_height', 1)
            blocks = result.get('blocks', [])
            
            text_boxes = []
            raw_text_parts = []
            
            for idx, block in enumerate(blocks):
                text_box = self._parse_block(block, idx, img_width, img_height)
                if text_box:
                    text_boxes.append(text_box)
                    raw_text_parts.append(text_box.text)
            
            logger.info(f"Detected {len(text_boxes)} text boxes")
            
            return MangaPageResult(
                page_id=page_id,
                image_path=image_path,
                text_boxes=text_boxes,
                raw_text='\n'.join(raw_text_parts),
                img_width=img_width,
                img_height=img_height
            )
            
        except Exception as e:
            logger.error(f"MangaPageOcr processing error: {e}")
            raise
    
    def _parse_block(
        self, 
        block: dict, 
        index: int, 
        img_width: int, 
        img_height: int
    ) -> Optional[TextBox]:
        """
        Parse a Mokuro text block into TextBox format.
        
        Block format:
        {
            "box": [x1, y1, x2, y2],  # xyxy pixel coordinates
            "vertical": bool,
            "font_size": float,
            "lines": ["line1", "line2", ...]
        }
        """
        try:
            # Get bounding box (xyxy format)
            bbox = block.get('box', [0, 0, img_width, img_height])
            x1, y1, x2, y2 = bbox
            
            # Get text from lines
            lines = block.get('lines', [])
            if not lines:
                return None
            
            # Join all lines for the text field, but keep lines separate too
            text = ''.join(lines)
            
            if not text.strip():
                return None
            
            # Get font size from Mokuro (clamped to 12-32 like original mokuro)
            font_size = block.get('font_size', 16)
            font_size = max(12, min(font_size, 32))
            
            # Convert to percentages
            x_percent = (x1 / img_width) * 100
            y_percent = (y1 / img_height) * 100
            width_percent = ((x2 - x1) / img_width) * 100
            height_percent = ((y2 - y1) / img_height) * 100
            
            return TextBox(
                id=f"box_{index}",
                text=text,
                x=x_percent,
                y=y_percent,
                width=width_percent,
                height=height_percent,
                confidence=0.95,  # Mokuro doesn't provide confidence
                vertical=block.get('vertical', True),
                lines=lines,
                font_size=font_size
            )
            
        except Exception as e:
            logger.warning(f"Error parsing block {index}: {e}")
            return None
    
    def _process_with_manga_ocr(
        self, 
        image_path: str, 
        page_id: str, 
        image_data: bytes
    ) -> MangaPageResult:
        """
        Fallback processing using manga-ocr only.
        This doesn't provide text box positions, just the full page text.
        """
        try:
            from PIL import Image
            import io
            
            logger.info("Processing with MangaOcr (fallback - no text detection)")
            
            # Load image
            img = Image.open(io.BytesIO(image_data))
            img_width, img_height = img.size
            
            # Run OCR on full image
            text = self._manga_ocr(img)
            
            # Create a single text box for the whole page
            text_boxes = []
            if text and text.strip():
                text_boxes.append(
                    TextBox(
                        id="box_0",
                        text=text,
                        x=5,
                        y=5,
                        width=90,
                        height=90,
                        confidence=0.8,
                        vertical=True,
                        lines=[text],
                        font_size=16
                    )
                )
            
            return MangaPageResult(
                page_id=page_id,
                image_path=image_path,
                text_boxes=text_boxes,
                raw_text=text or "",
                img_width=img_width,
                img_height=img_height
            )
            
        except Exception as e:
            logger.error(f"MangaOCR processing error: {e}")
            raise
    
    def process_image_base64(
        self, 
        base64_data: str, 
        filename: str = "manga.jpg"
    ) -> MangaPageResult:
        """
        Process a base64-encoded manga image.
        
        Args:
            base64_data: Base64 encoded image data (may include data URL prefix)
            filename: Original filename
            
        Returns:
            MangaPageResult with detected text boxes
        """
        # Remove data URL prefix if present
        if ',' in base64_data:
            base64_data = base64_data.split(',', 1)[1]
        
        image_data = base64.b64decode(base64_data)
        return self.process_image(image_data, filename)


# Singleton accessor
_mokuro_service: Optional[MokuroService] = None


def get_mokuro_service() -> MokuroService:
    """Get the singleton MokuroService instance."""
    global _mokuro_service
    if _mokuro_service is None:
        _mokuro_service = MokuroService()
    return _mokuro_service


def text_box_to_dict(box: TextBox) -> dict:
    """Convert TextBox to dictionary for JSON serialization."""
    return asdict(box)


def manga_page_result_to_dict(result: MangaPageResult) -> dict:
    """Convert MangaPageResult to dictionary for JSON serialization."""
    return {
        'page_id': result.page_id,
        'text_boxes': [text_box_to_dict(box) for box in result.text_boxes],
        'raw_text': result.raw_text,
        'img_width': result.img_width,
        'img_height': result.img_height,
    }
