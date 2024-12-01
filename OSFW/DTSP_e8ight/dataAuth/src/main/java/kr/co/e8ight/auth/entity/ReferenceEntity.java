package kr.co.e8ight.auth.entity;

import java.io.Serializable;
import java.time.LocalDateTime;

import javax.persistence.Column;
import javax.persistence.Convert;
import javax.persistence.MappedSuperclass;
import javax.persistence.PrePersist;
import javax.persistence.PreUpdate;
import javax.validation.constraints.NotNull;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.convert.threeten.Jsr310JpaConverters.LocalDateTimeConverter;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import com.fasterxml.jackson.annotation.JsonFormat;

@Setter @Getter
@Slf4j
@MappedSuperclass
public class ReferenceEntity implements Serializable {

    /**
     * The default serial version UID.
     */
    private static final long serialVersionUID = 1L;
    private static final Logger logger = LoggerFactory.getLogger(ReferenceEntity.class);

    
    @NotNull
    @CreatedDate
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern="yyyy-MM-dd HH:mm:ss", timezone = "Asia/Seoul")
    @Convert(converter = LocalDateTimeConverter.class)
    public LocalDateTime createAt;


    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern="yyyy-MM-dd HH:mm:ss", timezone = "Asia/Seoul")
    @Convert(converter = LocalDateTimeConverter.class)
    public LocalDateTime updateAt;

    @Column(name="CREATED_BY", nullable=false)
    private String createdBy;

    @Column(name="UPDATED_BY", nullable=false)
    private String updatedBy;
    
    public ReferenceEntity() {
    }
    

    
    @PrePersist
    public void prePersist() {
        log.debug("\n\n\n************************prePersist*************************\n\n\n");
    	LocalDateTime now = LocalDateTime.now().withNano(0);
    	String userName = this.getUserNameOfAuthenticatedUser();
    	this.createAt = now;
    	this.updateAt = now;
    	this.createdBy = userName != null ? userName : this.getCreatedBy();
    	this.updatedBy = userName != null ? userName : this.getCreatedBy();
    }
    
    @PreUpdate
    public void preUpdate() {
        log.debug("\n\n\n************************preUpdate*************************\n\n\n");
        LocalDateTime now = LocalDateTime.now().withNano(0);
    	String userName = this.getUserNameOfAuthenticatedUser();
    	
    	if (this.createAt == null)
    		this.createAt = now;
    
    	if (this.createdBy == null)
    		this.createdBy = userName != null ? userName : this.getCreatedBy();
    	
    	this.updateAt = now;
    	this.updatedBy = userName != null ? userName : this.getUpdatedBy();
    }
    
    private String getUserNameOfAuthenticatedUser() {
    	Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    	if(auth == null || !auth.isAuthenticated())
    		return null;
    	return auth.getName();
    }
}
