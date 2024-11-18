package kr.co.e8ight.auth.type;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum YesNoType {
	Y("Y") , N("N");
	private final String value;
}