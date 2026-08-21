package kr.co.e8ight.ndxpro.translatorRunner.translator;

public class Point {
    private final String type = "Point";
    private final double[] coordinates = new double[2];

    public Point(double x, double y) {
        this.coordinates[0] = x;
        this.coordinates[1] = y;
    }

    public String getType() {
        return type;
    }

    public double[] getCoordinates() {
        return coordinates;
    }
}
