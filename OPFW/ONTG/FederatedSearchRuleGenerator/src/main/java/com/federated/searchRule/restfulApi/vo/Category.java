package com.federated.searchRule.restfulApi.vo;

import java.util.ArrayList;

public class Category {

	private int categoryId;
	private String categoryName;
	private String category;
	private ArrayList<String> taskList;

	public String getCategory() {
		return category;
	}

	public void setCategory(String category) {
		this.category = category;
	}

	public ArrayList<String> getTaskList() {
		return taskList;
	}

	public void setTaskList(ArrayList<String> taskList) {
		this.taskList = taskList;
	}

	public int getCategoryId() {
		return categoryId;
	}

	public void setCategoryId(int categoryId) {
		this.categoryId = categoryId;
	}

	public String getCategoryName() {
		return categoryName;
	}

	public void setCategoryName(String categoryName) {
		this.categoryName = categoryName;
	}

}
