package kr.co.e8ight.ndxpro.databroker.dto;

import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.geo.GeoJson;

@NoArgsConstructor
public class GeoJsonImpl implements GeoJson {

    private String type;

    private Iterable<?> coordinates;

    @Override
    public String getType() {
        return type;
    }

    @Override
    public Iterable<?> getCoordinates() {
        return coordinates;
    }
}
