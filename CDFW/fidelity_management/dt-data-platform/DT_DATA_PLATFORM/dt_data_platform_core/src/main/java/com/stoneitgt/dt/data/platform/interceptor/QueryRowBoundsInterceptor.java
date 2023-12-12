package com.stoneitgt.dt.data.platform.interceptor;

import java.sql.Connection;
import java.util.Properties;

import org.apache.ibatis.executor.statement.StatementHandler;
import org.apache.ibatis.mapping.BoundSql;
import org.apache.ibatis.mapping.MappedStatement;
import org.apache.ibatis.mapping.SqlCommandType;
import org.apache.ibatis.plugin.Interceptor;
import org.apache.ibatis.plugin.Intercepts;
import org.apache.ibatis.plugin.Invocation;
import org.apache.ibatis.plugin.Plugin;
import org.apache.ibatis.plugin.Signature;
import org.apache.ibatis.reflection.DefaultReflectorFactory;
import org.apache.ibatis.reflection.MetaObject;
import org.apache.ibatis.reflection.ReflectorFactory;
import org.apache.ibatis.reflection.factory.DefaultObjectFactory;
import org.apache.ibatis.reflection.factory.ObjectFactory;
import org.apache.ibatis.reflection.wrapper.DefaultObjectWrapperFactory;
import org.apache.ibatis.reflection.wrapper.ObjectWrapperFactory;
import org.apache.ibatis.session.RowBounds;

@Intercepts({
		@Signature(type = StatementHandler.class, method = "prepare", args = { Connection.class, Integer.class }) })
public class QueryRowBoundsInterceptor implements Interceptor {

	private static final ObjectFactory DEFAULT_OBJECT_FACTORY = new DefaultObjectFactory();
	private static final ObjectWrapperFactory DEFAULT_OBJECT_WRAPPER_FACTORY = new DefaultObjectWrapperFactory();
	private static final ReflectorFactory DEFAULT_REFLECTOR_FACTORY = new DefaultReflectorFactory();

	@Override
	public Object intercept(Invocation invocation) throws Throwable {

		StatementHandler statementHandler = (StatementHandler) invocation.getTarget();
		MetaObject metaStatementHandler = MetaObject.forObject(statementHandler, DEFAULT_OBJECT_FACTORY,
				DEFAULT_OBJECT_WRAPPER_FACTORY, DEFAULT_REFLECTOR_FACTORY);

		MappedStatement mappedStatement = (MappedStatement) metaStatementHandler.getValue("delegate.mappedStatement");
		// select가 아닐 경우에는 그냥 실행
		if (!SqlCommandType.SELECT.equals(mappedStatement.getSqlCommandType())) {
			return invocation.proceed();
		}

		RowBounds rowBounds = (RowBounds) metaStatementHandler.getValue("delegate.rowBounds");
		// RowBounds가 없으면 그냥 실행
		if (rowBounds == null || rowBounds == RowBounds.DEFAULT) {
			return invocation.proceed();
		}

		BoundSql boundSql = (BoundSql) metaStatementHandler.getValue("delegate.boundSql");
		String originalSql = boundSql.getSql();
		// log.info("originalSql = {}", originalSql);
		// RowBounds가 있다!
		// 원래 쿼리에 paging sql 문을 붙여준다.
		StringBuffer sql = new StringBuffer();
		String suffixSql = "";
		if (originalSql.indexOf("/*||") > 0 && originalSql.indexOf("||*/") > 0) {
			suffixSql += originalSql.substring(originalSql.indexOf("/*||") + 4, originalSql.indexOf("||*/"));
		}
		sql.append("SELECT CAST(@ROWNUM := @ROWNUM + 1 AS INT) RNUM, X2.* \n");
		sql.append("       FROM ( SELECT COUNT(1) OVER() AS TOTAL_COUNT, X1.* \n");
		sql.append("              FROM ( \n");
		sql.append(originalSql);
		sql.append("              ) X1");
		sql.append("        " + suffixSql + " \n");
		sql.append("        LIMIT " + (rowBounds.getOffset() - 1) + "," + rowBounds.getLimit() + " ) X2 \n");
		sql.append("INNER JOIN (SELECT @ROWNUM := " + (rowBounds.getOffset() - 1) + ") XR1 \n");
		sql.append(" " + suffixSql + " \n");
//		log.info("sql = {}", sql.toString());

		// RowBounds 정보 제거
		metaStatementHandler.setValue("delegate.rowBounds.offset", RowBounds.NO_ROW_OFFSET);
		metaStatementHandler.setValue("delegate.rowBounds.limit", RowBounds.NO_ROW_LIMIT);
		// 변경된 쿼리로 바꿔치기
		metaStatementHandler.setValue("delegate.boundSql.sql", sql.toString());

		return invocation.proceed();
	}

	@Override
	public Object plugin(Object target) {
		return Plugin.wrap(target, this);
	}

	@Override
	public void setProperties(Properties properties) {
	}

}
