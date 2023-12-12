package com.stoneitgt.dt.data.platform.component;

import java.util.ArrayList;
import java.util.List;

import javax.validation.ConstraintValidator;
import javax.validation.ConstraintValidatorContext;

import org.passay.CharacterRule;
import org.passay.EnglishCharacterData;
import org.passay.LengthRule;
import org.passay.MessageResolver;
import org.passay.PasswordData;
import org.passay.PasswordValidator;
import org.passay.Rule;
import org.passay.RuleResult;
import org.passay.WhitespaceRule;
import org.passay.spring.SpringMessageResolver;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.MessageSource;

import com.stoneitgt.dt.data.platform.annotations.ValidPassword;



public class PasswordConstraintValidator implements ConstraintValidator<ValidPassword, String> {

	@Autowired
	private MessageSource messageSource;

	private int min = 8;
	private int max = 15;

	@Override
	public void initialize(ValidPassword password) {
		this.min = password.min();
		this.max = password.max();
	}

	@Override
	public boolean isValid(String password, ConstraintValidatorContext context) {
		PasswordValidator validator = this.getPasswordVAlidator();

		RuleResult result = this.validate(password);
		if (result.isValid()) {
			return true;
		}

		context.disableDefaultConstraintViolation();
		context.buildConstraintViolationWithTemplate(String.join(",", validator.getMessages(result)))
				.addConstraintViolation();
		return false;
	}

	public RuleResult validate(String password) {
		PasswordValidator validator = this.getPasswordVAlidator();
		RuleResult result = validator.validate(new PasswordData(password));
		return result;
	}

	private PasswordValidator getPasswordVAlidator() {
		MessageResolver resolver = new SpringMessageResolver(messageSource);
//		PasswordValidator validator = new PasswordValidator(resolver,
//				new LengthRule(this.min, this.max),
//				new CharacterRule(EnglishCharacterData.Alphabetical, 1),
//				new CharacterRule(EnglishCharacterData.Digit, 1),
//				new CharacterRule(EnglishCharacterData.Special, 1),
//				new WhitespaceRule());

		List<Rule> rules = new ArrayList<>();
		rules.add(new LengthRule(this.min, this.max));
		rules.add(new CharacterRule(EnglishCharacterData.Alphabetical, 1));
		rules.add(new CharacterRule(EnglishCharacterData.Digit, 1));
		rules.add(new CharacterRule(EnglishCharacterData.Special, 1));
		rules.add(new WhitespaceRule());

		PasswordValidator validator = new PasswordValidator(resolver, rules);
		return validator;
	}
}
