package com.softedgex.agrisuite.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

@Service
public class TwilioService {

    @Value("${twilio.account-sid}")
    private String accountSid;

    @Value("${twilio.auth-token}")
    private String authToken;

    @Value("${twilio.sms-number}")
    private String smsNumber;

    @Value("${twilio.whatsapp-number}")
    private String whatsappNumber;

    private final RestTemplate restTemplate = new RestTemplate();

    private boolean isMock() {
        return accountSid == null || authToken == null || 
               "mock_account_sid".equalsIgnoreCase(accountSid) || 
               "mock_auth_token".equalsIgnoreCase(authToken) || 
               accountSid.isBlank() || authToken.isBlank();
    }

    public boolean sendSms(String toMobile, String body) {
        if (isMock()) {
            System.out.println("[SIMULATED TWILIO SMS] To: " + toMobile + " | Body: " + body);
            return true;
        }

        try {
            String url = "https://api.twilio.com/2010-04-01/Accounts/" + accountSid + "/Messages.json";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            headers.setBasicAuth(accountSid, authToken);

            MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
            map.add("To", formatMobileNumber(toMobile));
            map.add("From", smsNumber);
            map.add("Body", body);

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(map, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);

            return response.getStatusCode() == HttpStatus.CREATED || response.getStatusCode() == HttpStatus.OK;
        } catch (Exception e) {
            System.err.println("Twilio SMS Dispatch Failed: " + e.getMessage());
            return false;
        }
    }

    public boolean sendWhatsApp(String toMobile, String body) {
        if (isMock()) {
            System.out.println("[SIMULATED TWILIO WHATSAPP] To: " + toMobile + " | Body: " + body);
            return true;
        }

        try {
            String url = "https://api.twilio.com/2010-04-01/Accounts/" + accountSid + "/Messages.json";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            headers.setBasicAuth(accountSid, authToken);

            MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
            map.add("To", "whatsapp:" + formatMobileNumber(toMobile));
            map.add("From", "whatsapp:" + whatsappNumber);
            map.add("Body", body);

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(map, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);

            return response.getStatusCode() == HttpStatus.CREATED || response.getStatusCode() == HttpStatus.OK;
        } catch (Exception e) {
            System.err.println("Twilio WhatsApp Dispatch Failed: " + e.getMessage());
            return false;
        }
    }

    private String formatMobileNumber(String mobile) {
        if (mobile == null) return "";
        String clean = mobile.replaceAll("[^0-9+]", "");
        // If it's a 10 digit number (Indian standard), auto-prefix +91 for Twilio compatibility
        if (clean.length() == 10) {
            return "+91" + clean;
        }
        // If it starts with 91 and has 12 digits, prepend +
        if (clean.length() == 12 && clean.startsWith("91")) {
            return "+" + clean;
        }
        // If it doesn't start with +, add + prefix
        if (!clean.startsWith("+")) {
            return "+" + clean;
        }
        return clean;
    }
}
