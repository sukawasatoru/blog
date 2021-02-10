SonarQube
=========


まず -Dsonar.branch.name=jenkinsfile を指定せずに build する必要がある
--debug を行ったときに
sonarcloud で project が作成されていないときに sonar.branch.name を指定すると --debug を付けると以下のエラーを確認できる
[DEBUG] [org.sonarqube.gradle.SonarQubeTask] GET 404 https://sonarcloud.io/api/project_branches/list?project=android-tinytable

[ERROR] [org.gradle.internal.buildevents.BuildExceptionReporter] com/android/build/gradle/api/BaseVariant が発生するとき
sonarqube から :sonarqube に変更すると通る
原因は不明
 -> 解析されていないだけなのでこれは使用することは出来ない

./gradlew --debug -Dsonar.organization=sukawasatoru-github -Dsonar.host.url=https://sonarcloud.io -Dsonar.login=31ec2b9759cb606d07b14ab4d61c1a38e6cfa4c5 -Dsonar.projectName=android-tinytable -Dsonar.projectKey=android-tinytable -Dsonar.verbose=true :onarqube

- - -

timestamp  
2018-02-10 (First edition)
