import os
from typing import Union

from django.db import models
from node_vm2 import VM, NodeVM


def get_skeleton_contents(file_name: str):
    module_dir = os.path.dirname(__file__)
    path = os.path.join(module_dir, 'skeletons', file_name)
    return open(path, 'r').read()


def get_node_modules_contents(path: str):
    module_dir = os.path.dirname(__file__)
    path = os.path.join(module_dir, 'node_modules', *os.path.split(path))
    return open(path, 'r').read()


class Program(models.Model):
    class Meta:
        verbose_name = '프로그램'
        verbose_name_plural = '프로그램'

    title = models.CharField('프로그램 이름', max_length=64)
    filename = models.CharField('파일 이름', max_length=32, default="vm.ts")
    content = models.TextField('코드', max_length=1024 * 1024, default=get_skeleton_contents('sample.ts'))
    is_visible = models.BooleanField('UI 노출 여부', default=False)
    wait_time_on_exit = models.FloatField('종료 시 대기 시간', default=3.0)

    def __str__(self):
        return f"{self.title}"

    def full_clean(self, exclude=None, validate_unique=True):
        super().full_clean(exclude, validate_unique)

        # TODO

    def trans_and_run(self, vm: Union[VM, NodeVM]):
        # 모듈을 합친다.
        ts_code = '\n'.join([
            self.content
        ])

        # TS -> JS 컴파일
        with NodeVM(console="redirect", require={
            "external": True,
            "builtin": ["*"],
        }) as compilerVM:
            module = compilerVM.run("""
                const ts = require('typescript');
                
                function main(ts_code) {
                    return ts.transpile(ts_code);            
                }
                
                module.exports = {
                    main
                };
            """, 'transpiler.js')
            js_code = module.call_member('main', ts_code)

        return vm.run(js_code, self.filename)


__all__ = [
    'Program'
]
