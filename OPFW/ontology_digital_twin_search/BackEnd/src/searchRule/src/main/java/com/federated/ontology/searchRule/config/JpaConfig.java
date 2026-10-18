package com.federated.ontology.searchRule.config;

import jakarta.persistence.EntityManagerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.transaction.PlatformTransactionManager;

@Configuration
@EnableJpaRepositories(
        basePackages = "com.federated.ontology.searchRule.repository.jpa",
        entityManagerFactoryRef = "entityManagerFactory",
        transactionManagerRef = "jpaTransactionManager"
)
public class JpaConfig {

    @Bean("jpaTransactionManager")
    public PlatformTransactionManager jpaTransactionManager(EntityManagerFactory emf) {
        return new JpaTransactionManager(emf);
    }
}
