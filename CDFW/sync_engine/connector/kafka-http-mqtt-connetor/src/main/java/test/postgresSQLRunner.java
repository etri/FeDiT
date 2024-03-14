package test;

import java.sql.*;

public class postgresSQLRunner {
    public static void main(String[] args) {
        String url = "jdbc:postgresql://192.168.140.123:5432/mirrorlake";
        String user = "postgres";
        String password = "keti123";

        try {
            Connection connection = DriverManager.getConnection(url, user, password);

            String query = "SELECT * FROM digital_object_data where digital_object_id=" + "'test'" + " order by rowtime desc limit " + 5;

            System.out.println("query: " + query);
            PreparedStatement preparedStatement = connection.prepareStatement(query);

            ResultSet resultSet = preparedStatement.executeQuery();
            System.out.println("resultSet: " + resultSet);
            while (resultSet.next()) {
                String data = resultSet.getString("data");
                String rowtime = resultSet.getString("rowtime");
                // 여기에서 데이터 활용 (예: 출력 또는 처리)

                System.out.println("Sensor data: " + data);
                System.out.println("Sensor rowtime: " + rowtime);
                System.out.println();
            }

            resultSet.close();
            preparedStatement.close();
            connection.close();
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
}