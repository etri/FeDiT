package kr.co.n2m.platform.admin.feature.img.query;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import kr.co.n2m.platform.admin.feature.attachfile.entity.AttachFile;

@Repository
public interface ImgAttachFileRepository extends JpaRepository<AttachFile, Long>{

}
