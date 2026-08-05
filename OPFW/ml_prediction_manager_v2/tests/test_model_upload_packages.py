import tempfile
import unittest
import zipfile
from pathlib import Path

from app.services import model_repository_service as repository
from app.services import production_deploy_service as deploy


class ModelUploadPackageTest(unittest.TestCase):
    def _prepare(self, filename: str, content: bytes, metadata: dict):
        temp = tempfile.TemporaryDirectory()
        root = Path(temp.name)
        upload = root / filename
        upload.write_bytes(content)
        artifact, package = repository._prepare_uploaded_artifact(
            upload,
            filename,
            metadata,
            root / "work",
        )
        return temp, artifact, package

    def test_sklearn_pickle_is_normalized_for_kserve(self):
        temp, artifact, package = self._prepare(
            "regressor.pkl",
            b"pickle-placeholder",
            {"model_type": "ml", "framework": "scikit-learn"},
        )
        self.addCleanup(temp.cleanup)
        self.assertEqual(package["package_format"], "sklearn")
        self.assertEqual((artifact / "model.joblib").read_bytes(), b"pickle-placeholder")

    def test_pytorch_mar_gets_torchserve_layout(self):
        temp, artifact, package = self._prepare(
            "classifier.mar",
            b"mar-placeholder",
            {"model_type": "dl", "framework": "pytorch"},
        )
        self.addCleanup(temp.cleanup)
        self.assertEqual(package["package_format"], "pytorch")
        self.assertTrue((artifact / "model-store" / "classifier.mar").is_file())
        self.assertIn("load_models=all", (artifact / "config" / "config.properties").read_text())

    def test_raw_pytorch_weight_is_rejected(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            upload = root / "weights.pth"
            upload.write_bytes(b"weights")
            with self.assertRaisesRegex(ValueError, "TorchServe Archive"):
                repository._prepare_uploaded_artifact(
                    upload,
                    upload.name,
                    {"model_type": "dl", "framework": "pytorch"},
                    root / "work",
                )

    def test_tensorflow_saved_model_zip_gets_version_directory(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            upload = root / "saved-model.zip"
            with zipfile.ZipFile(upload, "w") as archive:
                archive.writestr("export/saved_model.pb", b"saved-model")
                archive.writestr("export/variables/variables.index", b"index")
            artifact, package = repository._prepare_uploaded_artifact(
                upload,
                upload.name,
                {"model_type": "dl", "framework": "tensorflow"},
                root / "work",
            )
            self.assertEqual(package["package_format"], "tensorflow")
            self.assertTrue((artifact / "1" / "saved_model.pb").is_file())
            self.assertTrue((artifact / "1" / "variables" / "variables.index").is_file())

    def test_mlflow_bundle_takes_precedence_over_framework(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            upload = root / "model.zip"
            with zipfile.ZipFile(upload, "w") as archive:
                archive.writestr("bundle/MLmodel", "flavors: {}\n")
                archive.writestr("bundle/model.pkl", b"model")
            artifact, package = repository._prepare_uploaded_artifact(
                upload,
                upload.name,
                {"model_type": "dl", "framework": "pytorch"},
                root / "work",
            )
            self.assertEqual(package["package_format"], "mlflow")
            self.assertTrue((artifact / "MLmodel").is_file())


class KServeFormatTest(unittest.TestCase):
    def test_upload_package_tag_selects_runtime(self):
        self.assertEqual(
            deploy._detect_model_format(
                "unused",
                tags={"model.package_format": "pytorch", "framework": "pytorch"},
            ),
            "pytorch",
        )

    def test_tensorflow_uses_v1_protocol(self):
        class FakeCustom:
            def __init__(self):
                self.body = None

            def create_namespaced_custom_object(self, _group, _version, _namespace, _plural, body):
                self.body = body

        custom = FakeCustom()
        deploy._apply_isvc(
            custom,
            "model",
            "tenant",
            "model-pvc",
            "sample",
            "1",
            "tensorflow",
        )
        model = custom.body["spec"]["predictor"]["model"]
        self.assertEqual(model["modelFormat"]["name"], "tensorflow")
        self.assertEqual(model["protocolVersion"], "v1")


if __name__ == "__main__":
    unittest.main()
