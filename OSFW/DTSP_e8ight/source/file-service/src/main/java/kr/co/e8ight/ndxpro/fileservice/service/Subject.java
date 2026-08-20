package kr.co.e8ight.ndxpro.fileservice.service;

import kr.co.e8ight.ndxpro.fileservice.domain.PhysicalFile;

public interface Subject<T> {
    Observer<PhysicalFile> registerObserver(Observer<T> observer);
    void removeObserver(Observer<T> observer);
    void notify(T value);
}
