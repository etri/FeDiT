package net.jcms.framework.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.util.FileCopyUtils;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.*;
import java.nio.file.Path;
import java.nio.file.Paths;

@Slf4j
public class FileUtil {

	public static void updateFile(MultipartFile mpf, String filePath, String saveFileName) throws IOException{
		filePath = filePath.replaceAll("\\.{2,}[/\\\\]", "");
		saveFileName = saveFileName.replaceAll("\\.{2,}[/\\\\]", "");

		FileOutputStream fos = null;
		try {
			Path path = Paths.get(filePath, saveFileName);
			fos = new FileOutputStream(path.toString());
			FileCopyUtils.copy(mpf.getBytes(), fos);
		} finally {
			if(fos != null) { fos.close(); }
		}
	}

	public static void deleteFile(String filePath, String saveFileName){
		filePath = filePath.replaceAll("\\.{2,}[/\\\\]", "");
		saveFileName = saveFileName.replaceAll("\\.{2,}[/\\\\]", "");

		Path path = Paths.get(filePath, saveFileName);
		File deleteFile = new File(path.toString());
		if(deleteFile.exists()) {
			deleteFile.delete();
		}
	}

	public static void createFile(MultipartFile mpf, String filePath, String saveFileName) throws IOException{
		FileOutputStream fos = null;
		try {
			filePath = filePath.replaceAll("\\.{2,}[/\\\\]", "");
			saveFileName = saveFileName.replaceAll("\\.{2,}[/\\\\]", "");
			createFolder(filePath);

			Path path = Paths.get(filePath, saveFileName);
			fos = new FileOutputStream(path.toString());
			FileCopyUtils.copy(mpf.getBytes(), fos);
			
			//이미지 파일일 경우 썸네일 이미지 생성
			/*if(MediaType.IMAGE_GIF_VALUE.equals(mpf.getContentType())
					|| MediaType.IMAGE_JPEG_VALUE.equals(mpf.getContentType())
					|| MediaType.IMAGE_PNG_VALUE.equals(mpf.getContentType())) { //이미지 파일의 경우 썸네일 생성
				String thumbPath = filePath+PropertiesUtil.getProperty("AppConf.filePath.thumb");
				createFolder(thumbPath); //썸네일 폴더생성
				
				File originalFile = new File(filePath+saveFileName);
				File thumbnailFile = new File(thumbPath+saveFileName+PropertiesUtil.getProperty("AppConf.fileNm.thumb"));
				//썸네일  생성
				BufferedImage bi = ImageIO.read(originalFile);
				BufferedImage biThumbnail = new BufferedImage(200, 200, BufferedImage.TYPE_3BYTE_BGR);
				Graphics2D graphic = biThumbnail.createGraphics();
				graphic.drawImage(bi, 0, 0, 200, 200, null);
				ImageIO.write(biThumbnail, "jpg", thumbnailFile);
			}*/
		}  finally {
			if(fos != null) { fos.close(); }
		}
	}
	
	/**
	 * 썸네일 이미지를 생성한다.
	 * @param originalFile (변환대상)
	 * @param thumbnailPath (썸네일이미지를 생성할 경로)
	 * @param thumbnailFileNm (썸네일이미지 파일명)
	 */
	public static void createThumbnail(File originalFile, String thumbnailPath, String thumbnailFileNm, int width, int height) throws IllegalArgumentException, IOException{
		if(originalFile.exists()) { //변환할 파일이 존재하는지 확인
			File thumbnailFile = new File(thumbnailPath+thumbnailFileNm);
			if(thumbnailFile.exists()) thumbnailFile.delete(); //썸네일을 만들 경로에 같은 파일이 존재하면 삭제 후 생성

			//썸네일  생성
			BufferedImage bi = ImageIO.read(originalFile);
			BufferedImage biThumbnail = new BufferedImage(width, height, BufferedImage.TYPE_3BYTE_BGR);
			Graphics2D graphic = biThumbnail.createGraphics();
			graphic.drawImage(bi, 0, 0, width, height, null);
			ImageIO.write(biThumbnail, "jpg", thumbnailFile);
		}
	}
	
	public static void createThumbnail(File originalFile, String thumbnailPath, String thumbnailFileNm) throws IllegalArgumentException, IOException {
		createThumbnail(originalFile, thumbnailPath, thumbnailFileNm, 500, 500);
	}
	
	/**
	 * 파일경로에 폴더가 존재하지 않을 경우 생성한다.
	 */
	public static void createFolder(String filePath) {
		filePath = filePath.replaceAll("\\.{2,}[/\\\\]", "");
		File folder = new File(filePath);
		if(!folder.exists()) {
			folder.setExecutable(true);
			folder.setReadable(true);
			folder.setWritable(true);
			folder.mkdirs();
		}
	}
	
	/**
	 * Json 파일을 생성한다.
	 * @throws IOException 
	 */
	public static void createJson(String path, String fileNm, String json) throws UnsupportedEncodingException, FileNotFoundException, IOException{
		createFolder(path); //폴더가 없다면 새로 생성
		
		File file = new File(path+fileNm);
		OutputStreamWriter osw = null;
		FileOutputStream fos = null;
		BufferedWriter output = null;
		try {
			fos = new FileOutputStream(file.getPath());
			osw = new OutputStreamWriter(fos, "UTF-8");
			output = new BufferedWriter(osw);
			output.write(json);
		} finally {
			if(output != null) { output.close(); }
			if(osw != null) { osw.close(); }
			if(fos != null) { fos.close(); }
		}
	}
	
	/**
	 * 대상파일의 한줄만 읽어 오기(경로에 파일이 없을 경우 파일만 생성)
	 * @param path 파일경로
	 * @return
	 */
	public static String getFileOneLine(String path) throws FileNotFoundException, IOException {
		BufferedReader br = null;
		String line = "";
		try {
			File file = new File(path);
			if(!file.exists()){
				file.createNewFile();
			}
			br = new BufferedReader(new FileReader(file));
			line = br.readLine();
		} finally {
			if(br != null) { br.close(); }
		}
		return line;
	}
	
	/**
	 * 대상파일에 내용 지우고 쓰기
	 * @param text 내용
	 * @param path 파일경로
	 * @return
	 */
	public static void getFileWrite(String text, String path) throws IOException {
		FileWriter fw = null;
		try {
			fw = new FileWriter(new File(path), false);
			if(text.isEmpty()){
				text="";
			}
			fw.write(text);
		} finally {
			if(fw != null) { fw.close(); }
		}
	}
	
}
