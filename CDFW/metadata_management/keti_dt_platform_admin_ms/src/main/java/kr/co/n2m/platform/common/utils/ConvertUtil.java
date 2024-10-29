package kr.co.n2m.platform.common.utils;

import java.beans.PropertyDescriptor;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

import lombok.Data;

public class ConvertUtil {

	public static Object convertMapToObject(Map<String, Object> map, Object obj) {
		String keyAttribute = null;
		String setMethodString = "set";
		String methodString = null;

		Iterator<String> itr = map.keySet().iterator();

		while (itr.hasNext()) {
			keyAttribute = (String) itr.next();
			methodString = setMethodString + keyAttribute.substring(0, 1).toUpperCase() + keyAttribute.substring(1);
			Method[] methods = obj.getClass().getDeclaredMethods();
			for (int i = 0; i < methods.length; i++) {
				if (methodString.equals(methods[i].getName())) {
					try {
						methods[i].invoke(obj, map.get(keyAttribute));
					} catch (Exception e) {
						e.printStackTrace();
					}
				}
			}
		}
		return obj;
	}

	public static <C> C convertMapStringToBean(Map<String, String> source, Class<C> targetClass) {
	    C bean = null;
	    try {
	        bean = targetClass.newInstance();
	        PropertyDescriptor[] targetPds = org.springframework.beans.BeanUtils.getPropertyDescriptors(targetClass);

	        for (Map.Entry<String, String> mEntry : source.entrySet()) {
	        	for (PropertyDescriptor desc : targetPds) {
		        	if ( mEntry.getKey().equals(desc.getName()) ) {
		        		Method writeMethod = desc.getWriteMethod();
		                if (writeMethod != null) {
		                	switch ( desc.getPropertyType().getName() ) {
			                	case "int":
			                		writeMethod.invoke(bean, Integer.parseInt(mEntry.getValue()));
			                		break;
			                	case "boolean":
			                		writeMethod.invoke(bean, Boolean.valueOf(mEntry.getValue()));
			                		break;
			                	case "long":
			                		writeMethod.invoke(bean, Long.valueOf(mEntry.getValue()));
			                		break;
		                		default:
		                			System.out.println(desc.getPropertyType().getName());
		                			writeMethod.invoke(bean, mEntry.getValue());
		                			break;
		                	}
		                }
		        	}
		        }
	        }
	    } catch (InstantiationException e) {
	        new IllegalArgumentException("Cannot initiate class",e);
	    } catch (IllegalAccessException e) {
	        new IllegalStateException("Cannot access the property",e);
	    } catch (InvocationTargetException e) {
	        new IllegalArgumentException(e);
	    }
	    return bean;
	}

	public static <C> C convertMapToBean(Map<String, Object> source, Class<C> targetClass) {
		C bean = null;
		
		String mKey   = "";

		try {
			bean = targetClass.newInstance();
			
			PropertyDescriptor[] targetPds = org.springframework.beans.BeanUtils.getPropertyDescriptors(targetClass);
			PropertyDescriptor crrPds = null;

			mKey   = null;
			Object mValue = null;

			Map<String, List<TmpVO>> mArrayMapData = new HashMap<>();

			for (Map.Entry<String, Object> entry : source.entrySet()) {
				crrPds = null;
				mKey   = entry.getKey();
				mValue = entry.getValue();
				for (PropertyDescriptor desc : targetPds) {
					if ( mKey.equals(desc.getName()) ) {
						crrPds = desc;
						break;
					}
				}

				if (crrPds != null) {
					Method writeMethod = crrPds.getWriteMethod();
	                if (writeMethod != null && mValue != null && !"".equals(mValue) && !"null".equals(mValue)) {
	                	switch ( crrPds.getPropertyType().getName() ) {
	                		case "boolean":
		                		try { writeMethod.invoke(bean, Boolean.valueOf((String) mValue)); }
		                		catch (ClassCastException ex) {
		                			writeMethod.invoke(bean, (Boolean) mValue);
		                		}
		                		break;
	                		case "int":
		                		writeMethod.invoke(bean, Integer.valueOf( String.valueOf(mValue) ));
		                		break;
		                	case "long":
		                		writeMethod.invoke(bean, Long.valueOf( String.valueOf(mValue) ));
		                		break;
		                	case "[Ljava.lang.String;": // String[] 타입
		                		if(mValue instanceof String) {
		                			writeMethod.invoke(bean, new Object[] {((String) mValue).split(",")});
		                		}else {
		                			ArrayList<String> arrValue = (ArrayList<String>) mValue;
		                			String[] arrObj = arrValue.toArray(new String[] {});
		                			writeMethod.invoke(bean, new Object[] {arrObj});
		                		}
		                		break;
		                	case "java.util.List" :
		                		writeMethod.invoke(bean,mValue); 
		                		break;
		                	case "java.time.LocalDateTime":
		                		if(String.valueOf(mValue).contains("T")) {
		                			writeMethod.invoke(bean,StringUtil.parseLocalDateTime(String.valueOf(mValue), "yyyy-MM-dd'T'HH:mm:ss")); 
		                			break;
		                		}else {
		                			writeMethod.invoke(bean,StringUtil.parseLocalDateTime(String.valueOf(mValue), "yyyy-MM-dd HH:mm:ss")); 
		                			break;
		                		}
		                	case "java.math.BigDecimal":
		                		writeMethod.invoke(bean,new BigDecimal(String.valueOf(mValue))); 
		                		break;
	                		default:
	                			try {writeMethod.invoke(bean, String.valueOf(mValue));}
	                			catch (ClassCastException ex) {
		                			writeMethod.invoke(bean, mValue);
		                		}
	                			break;
	                	}
	                }
				}
				else {
					// List<Map<String, String>> 타입
					if ( chkArrayMap(mKey) ) {
						String[] kSplit = mKey.split("\\[", 3);
						kSplit = Stream.of(kSplit)
								.map((str) -> { return str.replace("[", "").replace("]", ""); })
								.toArray(size -> new String[size]);

						for (PropertyDescriptor desc : targetPds) {
							if ( kSplit[0].equals(desc.getName()) ) { crrPds = desc; break; }
						}

						if (crrPds != null) {
							List<TmpVO> lTmp = null;
							if (mArrayMapData.isEmpty() || mArrayMapData.get(kSplit[0]) == null) {
								lTmp = new ArrayList<>();
							}
							else { lTmp = mArrayMapData.get(kSplit[0]); }

							TmpVO _tmpVo = new TmpVO();
							_tmpVo.setListKey(kSplit[0]);
							_tmpVo.setListIndex(Integer.parseInt(kSplit[1]));
							_tmpVo.setMkey(kSplit[2]);
							_tmpVo.setMValue(String.valueOf(mValue));
							lTmp.add(_tmpVo);
							mArrayMapData.put(kSplit[0], lTmp);
						}
					}
				}
			}

			if (!mArrayMapData.isEmpty()) {
				for (Map.Entry<String, List<TmpVO>> _tEntry : mArrayMapData.entrySet()) {
					crrPds = null;
					for (PropertyDescriptor desc : targetPds) {
						if ( _tEntry.getKey().equals(desc.getName()) ) { crrPds = desc; break; }
					}

					int iMapSize = 0;
					for (TmpVO _tVo : _tEntry.getValue()) {
						iMapSize = iMapSize < (_tVo.listIndex + 1) ? _tVo.listIndex + 1 : iMapSize;
					}

					List<Map<String, String>> lResult = null;
					if (iMapSize == 0) continue;
					else {
						lResult = new ArrayList<>();
						for (int i = 0; i < iMapSize; i++) {
							Map<String, String> mT = new HashMap<>();
							lResult.add(mT);
						}
					}

					Map<String, String> _mT = null;
					for (TmpVO _tVo : _tEntry.getValue()) {
						_mT = lResult.get(_tVo.getListIndex());
						_mT.put(_tVo.getMkey(), _tVo.getMValue());
					}

					//
					Method writeMethod = crrPds.getWriteMethod();
					writeMethod.invoke(bean, lResult);
				}
			}
				
		} catch (InstantiationException | IllegalAccessException | IllegalArgumentException | InvocationTargetException e) {
			System.out.println(mKey);
			e.printStackTrace();
		}

		return bean;
	}

	private static boolean chkArrayMap(String key) {
		int iSBCountST = 0;
		int iSBCountED = 0;

		for (int i = 0; i < key.length(); i++) {
			if (key.charAt(i) == '[') iSBCountST++;
			if (key.charAt(i) == ']') iSBCountED++;
		}

		if (iSBCountST == 2 && iSBCountED == 2) { return true; }

		return false;
	}

	@Data
	static class TmpVO {
		private String listKey;
		private int listIndex;
		private String mkey;
		private String mValue;
	}

	public static <C> C convertMapToBeanOld(Map<String, Object> source, Class<C> targetClass) {
	    C bean = null;
	    try {
	        bean = targetClass.newInstance();
	        PropertyDescriptor[] targetPds = org.springframework.beans.BeanUtils.getPropertyDescriptors(targetClass);

	        for (Map.Entry<String, Object> mEntry : source.entrySet()) {
	        	for (PropertyDescriptor desc : targetPds) {

	        		// Set
		        	if ( mEntry.getKey().equals(desc.getName()) ) {
		        		System.out.println(mEntry.getKey());
		        		Method writeMethod = desc.getWriteMethod();
		                if (writeMethod != null && mEntry.getValue() != null && !"".equals(mEntry.getValue()) && !"null".equals(mEntry.getValue())) {
		                	switch ( desc.getPropertyType().getName() ) {
		                		case "boolean":
			                		try {
			                			writeMethod.invoke(bean, Boolean.valueOf((String) mEntry.getValue()));
			                		}
			                		catch (ClassCastException ex) {
			                			writeMethod.invoke(bean, (Boolean) mEntry.getValue());
			                		}
			                		break;
		                		case "int":
			                		writeMethod.invoke(bean, Integer.valueOf( String.valueOf(mEntry.getValue()) ));
			                		break;
			                	case "long":
			                		writeMethod.invoke(bean, Long.valueOf( String.valueOf(mEntry.getValue()) ));
			                		break;
			                	case "[Ljava.lang.String;": // String[] 타입
			                		ArrayList<String> arrValue = (ArrayList<String>) mEntry.getValue();
		                			String[] arrObj = arrValue.toArray(new String[] {});
		                			writeMethod.invoke(bean, new Object[] {arrObj});
			                		break;
		                		default:
		                			System.out.println(desc.getPropertyType().getName());
		                			writeMethod.invoke(bean, mEntry.getValue());
		                			break;
		                	}
		                }
		        	}
		        }
	        }
	    } catch (InstantiationException e) {
	        new IllegalArgumentException("Cannot initiate class",e);
	    } catch (IllegalAccessException e) {
	        new IllegalStateException("Cannot access the property",e);
	    } catch (InvocationTargetException e) {
	        new IllegalArgumentException(e);
	    }
	    return bean;
	}
}
