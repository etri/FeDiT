package com.federated.ontology.searchRule.controller.searchController;

import com.federated.ontology.searchRule.service.searchService.SearchService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/search")
public class SearchController {

    private final SearchService searchService;

    public SearchController(SearchService searchService) {
        this.searchService = searchService;
    }

    @GetMapping("/recommendations/combinations")
    public Map<String,Object> getSearchResults(
            @RequestParam("q") String q
    ) {
        return searchService.getSearchCombination(q);
    }

    @GetMapping("/recommendations/graph")
    public Map<String,Object> getSearchGraph(
            @RequestParam("q") String q
    ) {
        return searchService.getSearchGraph(q);
    }

    @GetMapping("/entities")
    public ResponseEntity<String> search(
            @RequestParam String type,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String options
    ) {
        ResponseEntity<String> response = searchService.getQueryResults(type, q, options);
        return response;
    }

}
