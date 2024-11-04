package com.federated.searchRule.restfulApi.vo;

import java.util.ArrayList;

public class DigitalTwinBehavior {

	private int behaviorId;
	private String behaviorName;
	private String behavior;
	private ArrayList<String> prototypeList;

	public int getBehaviorId() {
		return behaviorId;
	}

	public void setBehaviorId(int behaviorId) {
		this.behaviorId = behaviorId;
	}

	public String getBehaviorName() {
		return behaviorName;
	}

	public void setBehaviorName(String behaviorName) {
		this.behaviorName = behaviorName;
	}

	public String getBehavior() {
		return behavior;
	}

	public void setBehavior(String behavior) {
		this.behavior = behavior;
	}

	public ArrayList<String> getPrototypeList() {
		return prototypeList;
	}

	public void setPrototypeList(ArrayList<String> prototypeList) {
		this.prototypeList = prototypeList;
	}

}
