import os
import unittest
from unittest.mock import patch

from pydantic import ValidationError
from app.models.automl_models import AutoMLJobRequest
from app.automl_runner.job import _build_model, _fit_predict


class GPUTrainingTests(unittest.TestCase):
    def request(self, **kwargs):
        return AutoMLJobRequest(name='test', dataset_path='/tmp/test.csv',
                                target_column='target', **kwargs)

    def test_cpu_only_models_cannot_silently_consume_gpu_request(self):
        with self.assertRaises(ValidationError):
            self.request(models=['rf', 'mlp', 'lgbm'], gpu_per_trial=1)

    def test_empty_model_selection_is_rejected(self):
        with self.assertRaises(ValidationError):
            self.request(models=[])

    def test_single_device_training_does_not_reserve_multiple_gpus(self):
        with self.assertRaises(ValidationError):
            self.request(models=['xgb'], gpu_per_trial=2)

    def test_profile_defaults_and_request_overrides(self):
        with patch.dict(os.environ, {'AUTOML_BATCH_SIZE': '64',
                                     'AUTOML_MAX_CONCURRENT_TRIALS': '1'}):
            self.assertEqual(self.request().batch_size, 64)
            self.assertEqual(self.request(batch_size=512).batch_size, 512)

    def test_tabnet_cpu_request_stays_on_cpu_even_when_gpu_exists(self):
        model = _build_model('tabnet', 'regression', {}, use_gpu=False)
        self.assertEqual(str(model.device), 'cpu')

    def test_invalid_resource_profile_defaults_are_rejected(self):
        for name, value in [('AUTOML_BATCH_SIZE', '0'),
                            ('AUTOML_MAX_CONCURRENT_TRIALS', '0'),
                            ('AUTOML_GPU_MEMORY_FRACTION', '1.5')]:
            with self.subTest(name=name), patch.dict(os.environ, {name: value}):
                with self.assertRaises(ValidationError):
                    self.request()

    def test_tabnet_gpu_request_fails_when_cuda_is_missing(self):
        with patch('torch.cuda.is_available', return_value=False):
            with self.assertRaisesRegex(RuntimeError, 'CUDA is unavailable'):
                _build_model('tabnet', 'regression', {}, use_gpu=True)

    def test_xgboost_cpu_wheel_is_rejected_for_gpu_training(self):
        with patch('xgboost.build_info', return_value={'USE_CUDA': False}):
            with self.assertRaisesRegex(RuntimeError, 'CUDA-enabled'):
                _build_model('xgb', 'regression', {}, use_gpu=True)

    def test_xgboost_cpu_fallback_is_an_error(self):
        from unittest.mock import Mock
        model = Mock()
        model.get_params.return_value = {'device': 'cuda'}
        model.get_booster.return_value.save_config.return_value = '{"learner":{"generic_param":{"device":"cpu"}}}'
        with self.assertRaisesRegex(RuntimeError, 'fell back to CPU'):
            _fit_predict('xgb', model, [[1], [2]], [1, 2], [[3]], 'regression')


if __name__ == '__main__':
    unittest.main()
