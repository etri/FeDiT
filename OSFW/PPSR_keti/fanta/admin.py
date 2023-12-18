from django.apps import apps
from django.contrib import admin
from django.urls import NoReverseMatch, reverse
from django.utils.text import capfirst


class MyAdmin(admin.AdminSite):
    def get_app_list(self, request, app_label: str | None = None):
        # sort app
        app_dict = self._build_app_dict(request, app_label)

        if app_label:
            app_list = [app_dict]
        else:
            app_list = sorted(app_dict.values(), key=lambda x: x['name'].lower())

        # sort models
        def sort_model(x):
            res = x.get('_order') or x.get('name').lower()
            if isinstance(res, int):
                return f'{res:02}'

            return res

        for app in app_list:
            app['models'].sort(key=sort_model)

        return app_list

    def _build_app_dict(self, request, label=None):
        """
        Build the app dictionary. The optional `label` parameter filters models
        of a specific app.
        """
        app_dict = {}

        if label:
            models = {
                m: m_a for m, m_a in self._registry.items()
                if m._meta.app_label == label
            }
        else:
            models = self._registry

        for model, model_admin in models.items():
            app_label = model._meta.app_label

            has_module_perms = model_admin.has_module_permission(request)
            if not has_module_perms:
                continue

            perms = model_admin.get_model_perms(request)

            # Check whether user has any perm for this module.
            # If so, add the module to the model_list.
            if True not in perms.values():
                continue

            info = (app_label, model._meta.model_name)
            model_dict = {
                'name': capfirst(model._meta.verbose_name_plural),
                'object_name': model._meta.object_name,
                'perms': perms,
                'admin_url': None,
                'add_url': None,
                '_order': None,
            }

            if perms.get('change') or perms.get('view'):
                model_dict['view_only'] = not perms.get('change')
                try:
                    model_dict['admin_url'] = reverse('admin:%s_%s_changelist' % info, current_app=self.name)
                except NoReverseMatch:
                    pass
            if perms.get('add'):
                try:
                    model_dict['add_url'] = reverse('admin:%s_%s_add' % info, current_app=self.name)
                except NoReverseMatch:
                    pass

            if hasattr(model, 'admin_order'):
                model_dict['_order'] = model.admin_order
                model_dict['name'] = str(model_dict['_order']) + ') ' + model_dict['name']

            if app_label in app_dict:
                app_dict[app_label]['models'].append(model_dict)
            else:
                app_dict[app_label] = {
                    'name': apps.get_app_config(app_label).verbose_name,
                    'app_label': app_label,
                    'app_url': reverse(
                        'admin:app_list',
                        kwargs={'app_label': app_label},
                        current_app=self.name,
                    ),
                    'has_module_perms': has_module_perms,
                    'models': [model_dict],
                }

        if label:
            return app_dict.get(label)

        return app_dict


def register():
    global site

    site.site_header = 'KETI 데이터 후처리 시스템'
    site.site_title = 'KETI 데이터 후처리 시스템'
    site.index_title = '관리자 사이트'

    admin.site = site


site = MyAdmin()

__all__ = [
    'site',
    'register'
]
