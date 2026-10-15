import functools
import os
import tempfile
import threading
import unittest
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from unittest.mock import patch

import pandas as pd

from app.automl_runner.job import _load_dataset, _prepare_features_target


class DatasetIOTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)
        self.frame = pd.DataFrame({'feature': range(10), 'target': [0, 1] * 5})
        self.frame.to_csv(self.root / '한글 data.csv', index=False)
        self.frame.to_parquet(self.root / 'data.parquet', index=False)
        handler = functools.partial(SimpleHTTPRequestHandler, directory=str(self.root))
        self.server = ThreadingHTTPServer(('127.0.0.1', 0), handler)
        threading.Thread(target=self.server.serve_forever, daemon=True).start()
        self.addCleanup(self.server.server_close)
        self.addCleanup(self.server.shutdown)
        self.url = f'http://127.0.0.1:{self.server.server_port}'

    def test_unicode_local_path(self):
        pd.testing.assert_frame_equal(_load_dataset(str(self.root / '한글 data.csv')), self.frame)

    @unittest.skipUnless(os.name == 'posix', 'POSIX file permissions')
    def test_unreadable_local_file(self):
        path = self.root / '한글 data.csv'
        path.chmod(0)
        try:
            with self.assertRaises(PermissionError):
                _load_dataset(str(path))
        finally:
            path.chmod(0o600)

    def test_remote_parquet_with_query_and_temporary_cleanup(self):
        with patch('tempfile.tempdir', str(self.root)):
            pd.testing.assert_frame_equal(_load_dataset(self.url + '/data.parquet?token=test'), self.frame)
        self.assertFalse(list(self.root.glob('pman-dataset-*')))

    def test_stream_size_limit_without_head(self):
        with patch.object(SimpleHTTPRequestHandler, 'do_HEAD', lambda handler: handler.send_error(405)):
            with patch('app.automl_runner.job._DATASET_HARD_BYTES', 4), patch('tempfile.tempdir', str(self.root)):
                with self.assertRaisesRegex(ValueError, 'size limit'):
                    _load_dataset(self.url + '/data.parquet')
        self.assertFalse(list(self.root.glob('pman-dataset-*')))

    def test_missing_local_and_remote_files(self):
        with self.assertRaises(FileNotFoundError):
            _load_dataset(str(self.root / 'missing.csv'))
        with self.assertRaises(OSError):
            _load_dataset(self.url + '/missing.csv')

    def test_invalid_training_data(self):
        for frame, target in [(pd.DataFrame(), 'target'),
                              (pd.DataFrame({'target': [1] * 10}), 'target'),
                              (pd.DataFrame({'x': range(10), 'target': [1] * 10}), 'target')]:
            with self.subTest(columns=list(frame.columns)), self.assertRaises(ValueError):
                _prepare_features_target(frame, target, 'classification', 0.2)
