package kr.co.e8ight.ndxpro.agentManager.service;

import kr.co.e8ight.ndxpro.agentManager.domain.dto.ContextResponseDto;
import kr.co.e8ight.ndxpro.agentManager.domain.dto.DataModelDto;
import kr.co.e8ight.ndxpro.agentManager.exceptions.AgentException;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponents;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DataModelService {


    private final RestTemplate restTemplate;

    @Value("${data-manager.url}")
    private String dataManagerUrl;

    public boolean checkDataModels(List<DataModelDto> dataModels, String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", token);

        HttpEntity request = new HttpEntity(headers);

        for (DataModelDto model : dataModels) {
            UriComponents uriComponents = UriComponentsBuilder.fromUriString(dataManagerUrl)
                    .path("/context")
                    .queryParam("contextUrl", model.getContext())
                    .queryParam("full", true).build();

            ResponseEntity<ContextResponseDto> responseEntity = restTemplate.exchange(uriComponents.toUri(), HttpMethod.GET, request, ContextResponseDto.class);

            if ( !responseEntity.getStatusCode().equals(HttpStatus.OK) ||
                    responseEntity.getBody() == null ||
                    !responseEntity.getBody().getContext().containsKey(model.getModelType())
            ) {
                throw new AgentException(ErrorCode.RESOURCE_NOT_FOUND, "Context '" + model.getContext() + "' or Model Type '" +
                        model + "' not found.");
            }
        }
        return true;
    }
}
