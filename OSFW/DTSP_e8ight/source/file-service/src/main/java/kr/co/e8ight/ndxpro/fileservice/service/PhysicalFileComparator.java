package kr.co.e8ight.ndxpro.fileservice.service;

import java.util.Comparator;
import kr.co.e8ight.ndxpro.fileservice.domain.PhysicalFile;

public class PhysicalFileComparator implements Comparator<PhysicalFile> {

  @Override
  public int compare(PhysicalFile o1, PhysicalFile o2) {
    if ( o1 == null ) {
      return -1;
    }
    if ( o2 == null ) {
      return 1;
    }

    return o1.getSize().compareTo(o2.getSize());
  }
}
