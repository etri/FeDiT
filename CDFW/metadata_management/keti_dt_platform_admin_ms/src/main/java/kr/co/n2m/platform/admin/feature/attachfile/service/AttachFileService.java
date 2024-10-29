package kr.co.n2m.platform.admin.feature.attachfile.service;

import java.io.File;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import kr.co.n2m.platform.admin.feature.attachfile.entity.AttachFile;
import kr.co.n2m.platform.common.exception.FileDownloadException;
import kr.co.n2m.platform.common.exception.FileUploadException;
import kr.co.n2m.platform.common.property.FileProperty;

@Service
public class AttachFileService {

	private final Path fileLocation;

	@Autowired
	public AttachFileService(FileProperty prop) {
		this.fileLocation = Paths.get(prop.getUploadDir()).toAbsolutePath().normalize();

		try {
			Files.createDirectories(this.fileLocation);
		} catch (Exception e) {
			throw new FileUploadException("파일을 업로드할 디렉토리를 생성하지 못했습니다.", e);
		}
	}
	
	public Path uploadFile(MultipartFile file, String restoNm) {
		String fileName = StringUtils.cleanPath(file.getOriginalFilename());

		try {
			if (fileName.contains(".."))
				throw new FileUploadException("파일명에 부적합 문자가 포함되어 있습니다. " + fileName);

			Path targetLocation = getCheckCreateFile(restoNm);
			if (targetLocation == null) {
				throw new FileUploadException("파일 생성에 실패하였습니다. " + fileName);
			}

			Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

			return targetLocation;
		} catch (Exception e) {
			throw new FileUploadException("[" + fileName + "] 파일 업로드에 실패하였습니다. 다시 시도하십시오.", e);
		}
	}

	public Resource downloadFile(String fileRestoNm) {
		try {
			Path filePath = this.fileLocation.resolve(fileRestoNm).normalize();
			Resource resource = new UrlResource(filePath.toUri());

			if (resource.exists()) {
				return resource;
			} else {
				throw new FileDownloadException(fileRestoNm + " 파일을 찾을 수 없습니다.");
			}
		} catch (MalformedURLException e) {
			throw new FileDownloadException(fileRestoNm + " 파일을 찾을 수 없습니다.", e);
		}
	}

	public void removeFile(String fileRestoNm) {
		Path targetLocation = this.fileLocation.resolve(fileRestoNm);

		File isFile = targetLocation.toFile();
		if ( isFile.isFile() ) {
			isFile.delete();
		}
	}

	public void removeMultipleFiles(List<AttachFile> fileVo) {
		try {
			for(AttachFile attachFile : fileVo) {
		            removeFile(attachFile.getFileRestoNm()); 
		    }
        } catch(Exception e) {
            e.printStackTrace();
        }
	}
	
	public Path getCheckCreateFile(String restoNm) {
		Path targetLocation = null;
		int iMaxTry = 5;

		synchronized (this) {
			do {
				if (iMaxTry == 0) { targetLocation = null; break; }

				targetLocation = this.fileLocation.resolve(restoNm);
				File isFile = new File(targetLocation.getFileName().toString());
				if ( isFile.isFile() ) {
					try { Thread.sleep(100); } catch (Exception e) {}
					iMaxTry--;
					continue;
				}
				else { break; }
			} while(true);
		}

		return targetLocation;
	}
	
}
