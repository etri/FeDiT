from django import forms

from .models import *


class TypeScriptFieldEditor(forms.Textarea):
    def get_context(self, name, value, attrs):
        context = super().get_context(name, value, attrs)
        context['widget']['attrs'].update({
            'id': 'code',
            'monaco-editor': 'true',
            'data-language': 'typescript',
            'data-wordwrap': 'off',
            'data-minimap': 'true',
        })
        return context

    class Media:
        js = [
            "scripts/monaco/loader.js",
            "scripts/djangomonacoeditor/monaco.config.js",
        ]
        css = {
            "screen": ("scripts/djangomonacoeditor/monaco.custom.css",)
        }


class ProgramForm(forms.ModelForm):
    class Meta:
        model = Program
        fields = "__all__"
        widgets = {
            "content": TypeScriptFieldEditor()
        }


__all__ = [
    'ProgramForm',
]
