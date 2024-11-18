package kr.co.e8ight.auth.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import javax.validation.constraints.NotBlank;
import java.util.Objects;

@JsonInclude(JsonInclude.Include.NON_NULL)
@Setter @Getter
@ToString
public class TokenDto {
	private Integer id;
    private String accessToken;
    @Schema(description = "refreshToken", example = "true", required = true)
    @NotBlank(message = "refresh token을 입력해주세요.")
    private String refreshToken;
    private Long accessTokenExpiresIn;
    public TokenDto(Builder builder) {
        this.id = builder.id;
        this.accessToken = builder.accessToken;
        this.refreshToken = builder.refreshToken;
        this.accessTokenExpiresIn = builder.accessTokenExpiresIn;
    }

    public TokenDto() {
    }

    public TokenDto(Integer id, String accessToken, String refreshToken, Long accessTokenExpiresIn) {
        this.id = id;
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.accessTokenExpiresIn = accessTokenExpiresIn;
    }

    public static Builder builder() {
        return  new Builder();
    }

    public static class Builder {
        private Integer id;
        private String accessToken;
        private String refreshToken;
        private Long accessTokenExpiresIn;
        private Builder() {};

        public Builder id(Integer id) {
            this.id = id;
            return this;
        }

        public Builder accessToken(String accessToken) {
            this.accessToken = accessToken;
            return this;
        }

        public Builder refreshToken(String refreshToken) {
            this.refreshToken = refreshToken;
            return this;
        }

        public Builder accessTokenExpiresIn(Long accessTokenExpiresIn) {
            this.accessTokenExpiresIn = accessTokenExpiresIn;
            return this;
        }

        public TokenDto build() {
            return new TokenDto(this);
        }
    }
}