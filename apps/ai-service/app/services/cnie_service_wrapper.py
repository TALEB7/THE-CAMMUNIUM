import threading

from app.vendors.extraction_cnie.service import CNIEService


class CNIEWrapperService:
    _instance = None
    _lock = threading.Lock()

    def __init__(self):
        self._service = CNIEService()

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = CNIEWrapperService()
        return cls._instance

    def analyze(self, image, visualize: bool = False):
        return self._service.analyze_image(image, visualize=visualize)
