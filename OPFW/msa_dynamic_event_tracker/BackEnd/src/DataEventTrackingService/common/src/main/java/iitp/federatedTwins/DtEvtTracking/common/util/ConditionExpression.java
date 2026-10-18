package iitp.federatedTwins.DtEvtTracking.common.util;

import java.util.Arrays;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.expression.spel.SpelNode;
import org.springframework.expression.spel.ast.FloatLiteral;
import org.springframework.expression.spel.ast.IntLiteral;
import org.springframework.expression.spel.ast.LongLiteral;
import org.springframework.expression.spel.ast.OpAnd;
import org.springframework.expression.spel.ast.OpEQ;
import org.springframework.expression.spel.ast.OpGE;
import org.springframework.expression.spel.ast.OpGT;
import org.springframework.expression.spel.ast.OpLE;
import org.springframework.expression.spel.ast.OpLT;
import org.springframework.expression.spel.ast.OpMinus;
import org.springframework.expression.spel.ast.OpNE;
import org.springframework.expression.spel.ast.OpOr;
import org.springframework.expression.spel.ast.OperatorNot;
import org.springframework.expression.spel.ast.RealLiteral;
import org.springframework.expression.spel.ast.VariableReference;
import org.springframework.expression.spel.standard.SpelExpression;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.SimpleEvaluationContext;

public final class ConditionExpression {

	private static final Pattern REF_PATTERN = Pattern.compile("#\\{([^}]*)\\}");

	private static final Pattern VAR_PATTERN = Pattern.compile("#(v\\d+)");

	private static final SpelExpressionParser PARSER = new SpelExpressionParser();

	private static final Set<Class<?>> COMPARISON = new HashSet<>(
			Arrays.asList(OpGT.class, OpLT.class, OpGE.class, OpLE.class, OpEQ.class, OpNE.class));

	private static final Set<Class<?>> NUMBER_LITERAL = new HashSet<>(
			Arrays.asList(IntLiteral.class, LongLiteral.class, RealLiteral.class, FloatLiteral.class));

	private ConditionExpression() {
	}

	private static final class Compiled {
		final SpelExpression expression;
		final Map<String, String> varById;

		Compiled(SpelExpression expression, Map<String, String> varById) {
			this.expression = expression;
			this.varById = varById;
		}
	}

	public static void validate(String ctrlStatement) {
		compile(ctrlStatement);
	}

	public static boolean evaluate(String ctrlStatement, Map<String, String> valueById) {
		Compiled c = compile(ctrlStatement);

		SimpleEvaluationContext ctx = SimpleEvaluationContext.forReadOnlyDataBinding().build();
		for (Map.Entry<String, String> e : c.varById.entrySet()) {
			Double value = toNumber(valueById == null ? null : valueById.get(e.getKey()));
			if (value == null) {
				return false;
			}
			ctx.setVariable(e.getValue(), value);
		}

		Boolean result = c.expression.getValue(ctx, Boolean.class);
		return Boolean.TRUE.equals(result);
	}

	private static Compiled compile(String ctrlStatement) {
		if (ctrlStatement == null || ctrlStatement.trim().isEmpty()) {
			throw new IllegalArgumentException("조건식이 비어 있습니다.");
		}
		if (REF_PATTERN.matcher(ctrlStatement).replaceAll("").contains("#")) {
			throw new IllegalArgumentException("'#' 은 #{식별자} 형태로만 쓸 수 있습니다.");
		}

		Map<String, String> varById = new LinkedHashMap<>();
		Matcher m = REF_PATTERN.matcher(ctrlStatement);
		StringBuffer sb = new StringBuffer();
		while (m.find()) {
			String id = m.group(1).trim();
			if (id.isEmpty()) {
				throw new IllegalArgumentException("비어 있는 식별자 참조 #{} 가 있습니다.");
			}
			String var = varById.computeIfAbsent(id, k -> "v" + varById.size());
			m.appendReplacement(sb, Matcher.quoteReplacement("#" + var));
		}
		m.appendTail(sb);

		if (varById.isEmpty()) {
			throw new IllegalArgumentException("조건식에 #{식별자} 참조가 없습니다.");
		}

		SpelExpression expression;
		try {
			expression = PARSER.parseRaw(sb.toString());
		} catch (Exception e) {
			throw new IllegalArgumentException(toUserText("조건식 구문 오류: " + e.getMessage(), varById));
		}

		try {
			checkBoolean(expression.getAST(), new HashSet<>(varById.values()));
		} catch (IllegalArgumentException e) {
			throw new IllegalArgumentException(toUserText(e.getMessage(), varById));
		}
		return new Compiled(expression, varById);
	}

	private static void checkBoolean(SpelNode node, Set<String> vars) {
		if (COMPARISON.contains(node.getClass())) {
			checkOperand(node.getChild(0), vars);
			checkOperand(node.getChild(1), vars);
			return;
		}
		if (node instanceof OpAnd || node instanceof OpOr) {
			checkBoolean(node.getChild(0), vars);
			checkBoolean(node.getChild(1), vars);
			return;
		}
		if (node instanceof OperatorNot) {
			checkBoolean(node.getChild(0), vars);
			return;
		}
		throw unsupported(node);
	}

	private static void checkOperand(SpelNode node, Set<String> vars) {
		if (node instanceof VariableReference) {
			String name = node.toStringAST().substring(1);
			if (!vars.contains(name)) {
				throw unsupported(node);
			}
			return;
		}
		if (NUMBER_LITERAL.contains(node.getClass())) {
			return;
		}
		if (node instanceof OpMinus && node.getChildCount() == 1
				&& NUMBER_LITERAL.contains(node.getChild(0).getClass())) {
			return;
		}
		throw unsupported(node);
	}

	private static IllegalArgumentException unsupported(SpelNode node) {
		return new IllegalArgumentException("지원하지 않는 조건식입니다: '" + node.toStringAST()
				+ "'. 비교( > < >= <= == != ), 논리( && || ! ), 괄호, #{식별자}, 숫자만 쓸 수 있습니다.");
	}

	private static String toUserText(String text, Map<String, String> varById) {
		Map<String, String> idByVar = new LinkedHashMap<>();
		for (Map.Entry<String, String> e : varById.entrySet()) {
			idByVar.put(e.getValue(), e.getKey());
		}
		Matcher m = VAR_PATTERN.matcher(text);
		StringBuffer sb = new StringBuffer();
		while (m.find()) {
			String id = idByVar.get(m.group(1));
			m.appendReplacement(sb, Matcher.quoteReplacement(id != null ? "#{" + id + "}" : m.group()));
		}
		m.appendTail(sb);
		return sb.toString();
	}

	private static Double toNumber(String v) {
		if (v == null) {
			return null;
		}
		try {
			double d = Double.parseDouble(v.trim());
			return Double.isNaN(d) ? null : d;
		} catch (NumberFormatException e) {
			return null;
		}
	}
}
