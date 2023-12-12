package kr.udt.file.service;

import java.sql.Timestamp;
import java.text.SimpleDateFormat;
import java.util.Arrays;
import java.util.List;

public class SrcDataInsertVO {
	
	private String tbNm;
	
	private String[] header;
	
	private List<String[]> rows;

	private Timestamp timestamp;
	
	public String getTbNm() {
		return tbNm;
	}

	public void setTbNm(String tbNm) {
		this.tbNm = tbNm;
	}

	public String[] getHeader() {
		return Arrays.copyOf(this.header, this.header.length);
	}

	public void setHeader(String[] header) {
		this.header = Arrays.copyOf(header, header.length);
	}

	public List<String[]> getRows() {
		return rows;
	}

	public void setRows(List<String[]> rows) {
		this.rows = rows;
	}

	public Timestamp getTimestamp() {
		return timestamp;
	}
	
	public String getTimestampString() {
		return new SimpleDateFormat("yy.MM.dd HH:mm").format(this.timestamp);
	}

	public void setTimestamp(Timestamp timestamp) {
		this.timestamp = timestamp;
	}
	
	
	
}
