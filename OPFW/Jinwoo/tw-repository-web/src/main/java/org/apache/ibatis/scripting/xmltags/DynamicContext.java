package org.apache.ibatis.scripting.xmltags;

import org.apache.ibatis.ognl.OgnlContext;
import org.apache.ibatis.ognl.OgnlException;
import org.apache.ibatis.ognl.OgnlRuntime;
import org.apache.ibatis.ognl.PropertyAccessor;
import org.apache.ibatis.reflection.MetaObject;
import org.apache.ibatis.session.Configuration;

import java.lang.reflect.Array;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class DynamicContext {

	public static final String PARAMETER_OBJECT_KEY = "_parameter";
	public static final String DATABASE_ID_KEY = "_databaseId";

	static {
		OgnlRuntime.setPropertyAccessor(ContextMap.class, new ContextAccessor());
	}

	private final ContextMap bindings;
	private final StringBuilder sqlBuilder = new StringBuilder();
	private int uniqueNumber = 0;

	public DynamicContext(final Configuration configuration, final Object parameterObject) {
		if (parameterObject != null && !(parameterObject instanceof Map)) {
			MetaObject metaObject = configuration.newMetaObject(parameterObject);
			bindings = new ContextMap(metaObject);
		} else {
			bindings = new ContextMap(null);
		}
		bindings.put(PARAMETER_OBJECT_KEY, parameterObject);
		bindings.put(DATABASE_ID_KEY, configuration.getDatabaseId());
	}

	public Map<String, Object> getBindings() {
		return bindings;
	}

	public void bind(final String name, final Object value) {
		bindings.put(name, value);
	}

	public void appendSql(final String sql) {
		sqlBuilder.append(sql);
		sqlBuilder.append(" ");
	}

	public String getSql() {
		return sqlBuilder.toString().trim();
	}

	public int getUniqueNumber() {
		return uniqueNumber++;
	}

	static class ContextMap extends HashMap<String, Object> {
		private static final long serialVersionUID = 2977601501966151582L;

		private MetaObject parameterMetaObject;

		public ContextMap(final MetaObject parameterMetaObject) {
			this.parameterMetaObject = parameterMetaObject;
		}

		@Override
		public Object put(final String key, final Object value) {
			return super.put(key, value);
		}

		@Override
		public Object get(final Object key) {
			String strKey = (String) key;
			if (super.containsKey(strKey)) {
				return super.get(strKey);
			}

			if (parameterMetaObject != null) {
				Object object = parameterMetaObject.getValue(strKey);
				// issue #61 do not modify the context when reading
				// if (object != null) {
				// super.put(strKey, object);
				// }

				return object;
			}

			return null;
		}

		@SuppressWarnings("rawtypes")
		public boolean empty(final Object obj) {
			if (obj == null) return true;
			
			if (obj instanceof String) {
				if(((String)obj).trim().length()>0) return false;
				return true;
			} else if (obj instanceof Number ) {
				try { 
					String str = String.valueOf(obj);
					if(str.trim().length()>0) return false;
					return true;
				} catch(RuntimeException err) { return true; }
			} else if (obj instanceof List) {
				return ((List) obj).isEmpty();
			} else if (obj instanceof Map) {
				return ((Map) obj).isEmpty();
			} else if (obj instanceof Object[]) {
				return Array.getLength(obj) == 0;
			} else {
				try { 
					String str = obj.toString();
					if("undefined".equals(obj)) return true;
					if("null".equals(str)) return true;
					if(str.trim().length()>0) return false;
					return true;
				} catch(RuntimeException err) { return true; }
			}
		}
	}

	@SuppressWarnings("rawtypes")
	static class ContextAccessor implements PropertyAccessor {

		@Override
		public Object getProperty(final Map context, final Object target, final Object name) throws OgnlException {
			Map map = (Map) target;

			Object result = map.get(name);
			if (result != null) {
				return result;
			}

			Object parameterObject = map.get(PARAMETER_OBJECT_KEY);
			if (parameterObject instanceof Map) {
				return ((Map) parameterObject).get(name);
			}

			return null;
		}

		@SuppressWarnings("unchecked")
		@Override
		public void setProperty(final Map context, final Object target, final Object name, final Object value) throws OgnlException {
			Map map = (Map) target;
			map.put(name, value);
		}

		@Override
		public String getSourceAccessor(OgnlContext arg0, Object arg1, Object arg2) {
			// TODO Auto-generated method stub
			return null;
		}

		@Override
		public String getSourceSetter(OgnlContext arg0, Object arg1, Object arg2) {
			// TODO Auto-generated method stub
			return null;
		}

	}
}
