package kr.co.n2m.platform.admin.feature.img.query;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import kr.co.n2m.platform.admin.feature.img.entity.Img;

@Repository
public interface ImgRepository extends JpaRepository<Img, String>{

}
