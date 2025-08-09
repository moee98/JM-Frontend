import { useState, useEffect } from "react";
import React from "react";

import api from './index';
import { Job } from '../types/job';

const GetJobs = () => {
    const [jobs, setJobs] = useState<Job[]>([]);

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();

        const fetchJobs = async () => {
            try {
                const response = await api.get<Job[]>('/jobs', { signal: controller.signal });
                if (isMounted) {
                    setJobs(response.data);
                    console.log(response.data);
                }
            } catch (error) {
                if (isMounted) {
                    console.error("Failed to fetch jobs:", error);
                }
            }
        };
        fetchJobs();
        return () => {
            isMounted = false;
            controller.abort();
        };
    }, []);

}
return jobs;
