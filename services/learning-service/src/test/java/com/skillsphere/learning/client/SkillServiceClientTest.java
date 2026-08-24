package com.skillsphere.learning.client;

import com.skillsphere.learning.exception.ServiceUnavailableException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

public class SkillServiceClientTest {

    private SkillServiceClient client;
    private MockRestServiceServer mockServer;
    private HttpServletRequest httpServletRequest;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder();
        
        builder.requestInterceptor((request, body, execution) -> {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest servletRequest = attributes.getRequest();
                String authHeader = servletRequest.getHeader(HttpHeaders.AUTHORIZATION);
                if (authHeader != null) {
                    request.getHeaders().add(HttpHeaders.AUTHORIZATION, authHeader);
                }
            }
            return execution.execute(request, body);
        });

        mockServer = MockRestServiceServer.bindTo(builder).build();
        RestClient restClient = builder.build();
        client = new SkillServiceClient(restClient, "http://localhost:8081/api/v1");

        httpServletRequest = mock(HttpServletRequest.class);
        ServletRequestAttributes attributes = new ServletRequestAttributes(httpServletRequest);
        RequestContextHolder.setRequestAttributes(attributes);
    }

    @Test
    void employeeExists_True() {
        UUID employeeId = UUID.randomUUID();
        when(httpServletRequest.getHeader(HttpHeaders.AUTHORIZATION)).thenReturn("Bearer dummy-token");

        mockServer.expect(requestTo("http://localhost:8081/api/v1/employees/" + employeeId))
                .andExpect(method(org.springframework.http.HttpMethod.GET))
                .andExpect(header(HttpHeaders.AUTHORIZATION, "Bearer dummy-token"))
                .andRespond(withSuccess());

        boolean exists = client.employeeExists(employeeId);
        assertTrue(exists);
        mockServer.verify();
    }

    @Test
    void employeeExists_NotFound_ReturnsFalse() {
        UUID employeeId = UUID.randomUUID();
        when(httpServletRequest.getHeader(HttpHeaders.AUTHORIZATION)).thenReturn("Bearer dummy-token");

        mockServer.expect(requestTo("http://localhost:8081/api/v1/employees/" + employeeId))
                .andRespond(withResourceNotFound());

        boolean exists = client.employeeExists(employeeId);
        assertFalse(exists);
        mockServer.verify();
    }

    @Test
    void employeeExists_Unreachable_ThrowsServiceUnavailable() {
        UUID employeeId = UUID.randomUUID();
        when(httpServletRequest.getHeader(HttpHeaders.AUTHORIZATION)).thenReturn("Bearer dummy-token");

        mockServer.expect(requestTo("http://localhost:8081/api/v1/employees/" + employeeId))
                .andRespond(withServerError());

        assertThrows(ServiceUnavailableException.class, () -> client.employeeExists(employeeId));
    }

    @Test
    void employeeExists_NoToken_ThrowsServiceUnavailable() {
        UUID employeeId = UUID.randomUUID();
        when(httpServletRequest.getHeader(HttpHeaders.AUTHORIZATION)).thenReturn(null);

        assertThrows(ServiceUnavailableException.class, () -> client.employeeExists(employeeId));
    }
}
