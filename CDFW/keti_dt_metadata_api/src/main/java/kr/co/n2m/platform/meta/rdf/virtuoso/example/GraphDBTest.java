package kr.co.n2m.platform.meta.rdf.virtuoso.example;

import virtuoso.jena.driver.VirtGraph;

public class GraphDBTest {

	public static void main(String[] args) {
		
		String url = "jdbc:virtuoso://1.234.5.217:1111/charset=UTF-8";
		String username = "meta_manager";
		String password = "dtmetapw1!";
		String devGraphName = "DEV_GRAPH_NM";
		VirtGraph graph = new VirtGraph (devGraphName, url, username, password);
		
		
		
//		graph.ad
		
		
		
	}
	
	public void addResource() {
		
	}
	
}
