package com.resolve.backend.dto;

import com.resolve.backend.model.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDataDTO {

    private Profile profile;
    private List<Experience> experiences;
    private List<Education> education;
    private List<Skill> skills;
    private List<Project> projects;
}
