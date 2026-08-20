package kr.co.e8ight.ndxpro.fileservice.service;

import kr.co.e8ight.ndxpro.fileservice.domain.PhysicalFile;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class FileUploadEvent implements Subject<PhysicalFile> {

    private Map<Long, List<Observer<PhysicalFile>>> observers = new HashMap<>();

    @Override
    public Observer<PhysicalFile> registerObserver(Observer<PhysicalFile> observer) {
        List<Observer<PhysicalFile>> observerList;
        if ( observers.containsKey(observer.getTarget()) ) {
            observerList = observers.get(observer.getTarget());
        } else {
            observerList = new ArrayList<>();
            observers.put(observer.getTarget(), observerList);
        }
        observerList.add(observer);
        return observer;
    }

    @Override
    public void removeObserver(Observer<PhysicalFile> observer) {
        List<Observer<PhysicalFile>> observerList = observers.get(observer.getTarget());
        observerList.remove(observer);
    }

    @Override
    public void notify(PhysicalFile value) {
        for (Observer<PhysicalFile> observer : observers.get(value.getId())) {
            observer.update(value);
        }
        observers.remove(value.getId());
    }
}