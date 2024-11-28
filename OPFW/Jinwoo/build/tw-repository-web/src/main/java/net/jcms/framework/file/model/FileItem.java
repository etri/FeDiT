package net.jcms.framework.file.model;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.SuperBuilder;
import net.jcms.framework.base.model.BaseModel;
import org.apache.ibatis.type.Alias;

@Getter
@Setter
@SuperBuilder(toBuilder=true)
@NoArgsConstructor
@ToString
@Alias("fileItem")
public class FileItem extends BaseModel{

	private Long itemId;
	private Long fileId;
	private String fileNm;
	private String fileExt;
	private String mediaTp;
	private Integer fileSize;
	private String savePath;
	private String saveFileNm;
	private Long dwnCnt;
	
//	public Long getItemId() {
//		return itemId;
//	}
//	public void setItemId(Long itemId) {
//		this.itemId = itemId;
//	}
//	public Long getFileId() {
//		return fileId;
//	}
//	public void setFileId(Long fileId) {
//		this.fileId = fileId;
//	}
//	public String getFileNm() {
//		return fileNm;
//	}
//	public void setFileNm(String fileNm) {
//		this.fileNm = fileNm;
//	}
//	public String getFileExt() {
//		return fileExt;
//	}
//	public void setFileExt(String fileExt) {
//		this.fileExt = fileExt;
//	}
//	public String getMediaTp() {
//		return mediaTp;
//	}
//	public void setMediaTp(String mediaTp) {
//		this.mediaTp = mediaTp;
//	}
//	public Integer getFileSize() {
//		return fileSize;
//	}
//	public void setFileSize(Integer fileSize) {
//		this.fileSize = fileSize;
//	}
//	public String getSavePath() {
//		return savePath;
//	}
//	public void setSavePath(String savePath) {
//		this.savePath = savePath;
//	}
//	public String getSaveFileNm() {
//		return saveFileNm;
//	}
//	public void setSaveFileNm(String saveFileNm) {
//		this.saveFileNm = saveFileNm;
//	}
//	public Long getDwnCnt() {
//		return dwnCnt;
//	}
//	public void setDwnCnt(Long dwnCnt) {
//		this.dwnCnt = dwnCnt;
//	}

}
