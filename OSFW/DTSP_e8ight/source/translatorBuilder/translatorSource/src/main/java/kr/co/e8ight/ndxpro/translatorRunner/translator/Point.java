package kr.co.e8ight.ndxpro.translatorRunner.translator;

public class Point {
    private String type = "Point";
    private double[] coordinates = new double[2];

    public Point(Object coordinates) {
        this.coordinates = (double[]) coordinates;
    }

    public String getType() {
        return type;
    }

    public double[] getCoordinates() {
        return coordinates;
    }
}
