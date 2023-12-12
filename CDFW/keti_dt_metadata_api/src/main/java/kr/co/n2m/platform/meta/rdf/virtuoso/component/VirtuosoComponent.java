package kr.co.n2m.platform.meta.rdf.virtuoso.component;

import org.springframework.beans.factory.annotation.Autowired;

import kr.co.n2m.platform.meta.architecture.property.VirtuosoProperty;
import virtuoso.jena.driver.VirtGraph;

public class VirtuosoComponent {
	
	@Autowired
	private VirtuosoProperty property;
	
	public VirtGraph getNewVirtGraphForDev() {
		VirtGraph virtGraph = new VirtGraph(property.getDevGraphName(), property.getUrl(), property.getUsername(), property.getPassword(), false);
		return virtGraph;
	}
	
	public VirtGraph getNewVirtGraphForUse() {
		VirtGraph virtGraph = new VirtGraph(property.getUseGraphName(), property.getUrl(), property.getUsername(), property.getPassword(), false);
		return virtGraph;
	}
	
	public String getGraphNameForDev() {
		return property.getDevGraphName();
	}
	
	public String getGraphNameForUse() {
		return property.getUseGraphName();
	}
	
	public String getUriForDev(String resourceName) {
		return property.getDevGraphName() + resourceName;
	}
	
	public String getUriForUse(String resourceName) {
		return property.getUseGraphName() + resourceName;
	}
	
	public String getConductorUrl() {
		return property.getConductorUrl();
	}
	
}
